// This service orchestrates the upload to Supabase and calls the backend API
// It essentially acts as the "Client Logic" for the architecture.
// NOTE: The transcribeAudioDirect function is a fallback for local development only.
// Production always uses the server-side API with proper file uploads.

import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Participant } from '../types';
import { AudioChunk, formatTimeRange, combineTranscriptions } from './audioChunker';

export interface ChunkProgress {
  currentChunk: number;
  totalChunks: number;
  status: 'uploading' | 'transcribing' | 'done';
  timeRange: string;
}

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

  // Set a long timeout (10 minutes) for transcription requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("API Error:", err);

    // Provide better error message for timeout/abort
    if (err.name === 'AbortError') {
      throw new Error('Transcriptie timeout - de audio is mogelijk te lang. Probeer een kortere opname.');
    }

    throw err;
  }
};

/**
 * Process audio in chunks for long recordings
 * This prevents timeouts by processing smaller segments sequentially
 */
export const processAudioChunked = async (
  chunks: AudioChunk[],
  participants?: Participant[],
  language: 'en' | 'nl' = 'nl',
  onProgress?: (progress: ChunkProgress) => void
): Promise<string> => {
  if (!supabase) {
    throw new Error("Supabase is niet geconfigureerd.");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Je moet ingelogd zijn om audio te uploaden.");
  }

  const transcriptions: { text: string; timeRange: string }[] = [];
  const sessionId = uuidv4();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const timeRange = formatTimeRange(chunk.startTime, chunk.endTime);

    // Report progress: uploading
    onProgress?.({
      currentChunk: i + 1,
      totalChunks: chunks.length,
      status: 'uploading',
      timeRange
    });

    // Upload chunk to Supabase
    const fileName = `${user.id}/chunk-${sessionId}-${i}.webm`;
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(fileName, chunk.blob, {
        contentType: chunk.blob.type,
        upsert: false
      });

    if (uploadError) {
      console.error(`Chunk ${i} upload error:`, uploadError);
      throw new Error(`Fout bij uploaden chunk ${i + 1}: ${uploadError.message}`);
    }

    // Get signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('recordings')
      .createSignedUrl(fileName, 3600);

    if (signedError || !signedData?.signedUrl) {
      throw new Error(`Fout bij genereren URL voor chunk ${i + 1}`);
    }

    // Report progress: transcribing
    onProgress?.({
      currentChunk: i + 1,
      totalChunks: chunks.length,
      status: 'transcribing',
      timeRange
    });

    // Transcribe chunk
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    const transcribeUrl = apiBaseUrl ? `${apiBaseUrl}/api/transcribe` : '/api/transcribe';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min per chunk

    try {
      const response = await fetch(transcribeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: signedData.signedUrl,
          mimeType: chunk.blob.type,
          participants: participants || [],
          language: language,
          isChunk: true,
          chunkIndex: i,
          totalChunks: chunks.length
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error voor chunk ${i + 1}: ${errorText}`);
      }

      const result = await response.json();
      transcriptions.push({ text: result.text, timeRange });

      // Cleanup: delete chunk from storage after successful transcription
      await supabase.storage.from('recordings').remove([fileName]);

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Timeout bij chunk ${i + 1}. Probeer kortere opnames.`);
      }
      throw err;
    }
  }

  // Report progress: done
  onProgress?.({
    currentChunk: chunks.length,
    totalChunks: chunks.length,
    status: 'done',
    timeRange: formatTimeRange(chunks[0].startTime, chunks[chunks.length - 1].endTime)
  });

  // Combine all transcriptions
  return combineTranscriptions(transcriptions);
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