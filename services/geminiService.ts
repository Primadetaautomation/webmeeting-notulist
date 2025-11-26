// This service now orchestrates the upload to Supabase and calls the backend API
// It essentially acts as the "Client Logic" for the architecture.

import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";

export const processAudioRecording = async (audioBlob: Blob): Promise<string> => {
  // 1. Check if Supabase is available
  if (!supabase) {
    throw new Error("Supabase is niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe aan je .env bestand of gebruik de lokale modus.");
  }

  // 1. Upload to Supabase Storage
  // Make sure you created a public bucket named 'recordings' in Supabase
  const fileName = `meeting-${uuidv4()}.webm`;
  
  const { data, error } = await supabase.storage
    .from('recordings')
    .upload(fileName, audioBlob, {
      contentType: audioBlob.type,
      upsert: false
    });

  if (error) {
    console.error("Supabase Upload Error:", error);
    throw new Error("Fout bij uploaden naar opslag: " + error.message);
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('recordings')
    .getPublicUrl(fileName);

  // 3. Call Vercel Backend Function
  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fileUrl: publicUrl,
        mimeType: audioBlob.type 
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Server error during transcription");
    }

    const result = await response.json();
    return result.text;

  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
};

/**
 * Legacy Client-Side method (fallback if no backend is set up)
 * Still useful for local testing if API keys are exposed
 */

export const transcribeAudioDirect = async (audioBlob: Blob): Promise<string> => {
    // Robust check for API Key
    // Guidelines require using process.env.API_KEY exclusively
    if (!process.env.API_KEY) throw new Error("API Key ontbreekt. Zorg voor een API_KEY environment variable.");
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
    });
    const base64Audio = await base64Promise;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { inlineData: { mimeType: audioBlob.type, data: base64Audio } },
            { text: "Transcribeer dit gesprek. Links=Ik, Rechts=Anderen." }
        ]
      }
    });
    return response.text || "";
}