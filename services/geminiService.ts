// This service now orchestrates the upload to Supabase and calls the backend API
// It essentially acts as the "Client Logic" for the architecture.

import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";
import { Participant } from '../types';

export const processAudioRecording = async (audioBlob: Blob, participants?: Participant[]): Promise<string> => {
  // 1. Check if Supabase is available
  if (!supabase) {
    throw new Error("Supabase is niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe aan je .env bestand of gebruik de lokale modus.");
  }

  // Get current user for secure file path
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Je moet ingelogd zijn om audio te uploaden.");
  }

  // Upload to user-specific folder for RLS security: {user_id}/{filename}
  const fileName = `${user.id}/meeting-${uuidv4()}.webm`;

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

  // 2. Get Signed URL (expires in 1 hour - enough for transcription)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('recordings')
    .createSignedUrl(fileName, 3600); // 1 hour expiry

  if (signedError || !signedData?.signedUrl) {
    console.error("Signed URL Error:", signedError);
    throw new Error("Fout bij genereren van beveiligde URL");
  }

  const fileUrl = signedData.signedUrl;

  // 3. Call Backend API (Railway or Vercel fallback)
  const apiBaseUrl = import.meta.env.VITE_API_URL || '';
  const transcribeUrl = apiBaseUrl ? `${apiBaseUrl}/api/transcribe` : '/api/transcribe';

  try {
    const response = await fetch(transcribeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl: fileUrl,
        mimeType: audioBlob.type,
        participants: participants || []
      }),
    });

    if (!response.ok) {
      // Try to parse as JSON, fallback to text if not valid JSON
      const responseText = await response.text();
      let errorMessage = "Server error during transcription";
      try {
        const errData = JSON.parse(responseText);
        errorMessage = errData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    try {
      const result = JSON.parse(responseText);
      return result.text;
    } catch {
      throw new Error("Ongeldige response van server: " + responseText.substring(0, 100));
    }

  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
};

/**
 * Legacy Client-Side method (fallback if no backend is set up)
 * Still useful for local testing if API keys are exposed
 */

export const transcribeAudioDirect = async (audioBlob: Blob, participants?: Participant[]): Promise<string> => {
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

    // Build participant info for the prompt
    let participantInfo = '';
    if (participants && participants.length > 0) {
      const participantLines = participants.map(p => {
        const displayName = p.name.trim() || `Spreker ${p.index}`;
        const channel = p.isRecorder ? 'LINKS' : 'RECHTS';
        const role = p.isRecorder ? ' (opnemer)' : '';
        return `- "${displayName}"${role} (${channel})`;
      });
      participantInfo = `
DEELNEMERS (${participants.length} personen):
${participantLines.join('\n')}
GEBRUIK DEZE EXACTE NAMEN!
`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { inlineData: { mimeType: audioBlob.type, data: base64Audio } },
            { text: `Je bent een professionele notulist. Transcribeer de audio nauwkeurig in het Nederlands.
${participantInfo}
STEREO KANALEN:
- LINKS = De opnemer
- RECHTS = Andere deelnemers

INSTRUCTIES:
1. Corrigeer alle spelfouten en grammatica
2. Maak de tekst vloeiend en leesbaar
3. Gebruik de opgegeven namen als speaker labels (of "Spreker 1", "Spreker 2" als geen namen bekend)
4. Groepeer uitspraken per spreker

FORMAT:
**[Naam/Spreker]:** [tekst]

Eindig met:
## Samenvatting
## Actiepunten
## Beslissingen` }
        ]
      }
    });
    return response.text || "";
}