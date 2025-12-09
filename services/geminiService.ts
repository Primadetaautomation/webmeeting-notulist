// This service orchestrates the upload to Supabase and calls the backend API
// It essentially acts as the "Client Logic" for the architecture.
// NOTE: The transcribeAudioDirect function is a fallback for local development only.
// Production always uses the server-side API with proper file uploads.

import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Participant } from '../types';

export const processAudioRecording = async (audioBlob: Blob, participants?: Participant[], language: 'en' | 'nl' = 'nl'): Promise<string> => {
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
        participants: participants || [],
        language: language
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
 * This is kept for local development only.
 * WARNING: This uses inline data which only works for files < 20MB.
 * Production should always use the server-side API.
 */
export const transcribeAudioDirect = async (_audioBlob: Blob, _participants?: Participant[], language: 'en' | 'nl' = 'nl'): Promise<string> => {
    // This function is deprecated in favor of server-side transcription
    // The inline data approach has limitations and the SDK mixing caused issues
    throw new Error(
      language === 'nl'
        ? "Directe transcriptie is uitgeschakeld. Configureer Supabase voor server-side transcriptie."
        : "Direct transcription is disabled. Configure Supabase for server-side transcription."
    );
}