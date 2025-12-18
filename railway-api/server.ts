import express, { Request, Response } from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 8080;

// Helper to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Increase timeout for long-running transcription requests
app.use((_req, res, next) => {
  // Set timeout to 10 minutes (600 seconds) for transcription
  res.setTimeout(600000); // 10 minutes
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Transcribe endpoint
app.post('/api/transcribe', async (req: Request, res: Response) => {
  // Set long timeout for this specific endpoint
  req.setTimeout(600000);

  const { fileUrl, mimeType, participants, language = 'nl' } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ error: 'Missing fileUrl' });
  }

  // Build participant info for the prompt
  let participantPromptSection = '';
  if (participants && Array.isArray(participants) && participants.length > 0) {
    const otherParticipantsCount = participants.filter((p: { isRecorder: boolean }) => !p.isRecorder).length;

    if (language === 'nl') {
      const participantLines = participants.map((p: { index: number; name: string; isRecorder: boolean }) => {
        const displayName = p.name.trim() || `Spreker ${p.index}`;
        const channel = p.isRecorder ? 'LINKER kanaal' : 'RECHTER kanaal';
        const role = p.isRecorder ? ' (de opnemer)' : '';
        return `- "${displayName}"${role} (${channel})`;
      });

      participantPromptSection = `
## DEELNEMERS INFORMATIE (BELANGRIJK!)
Er zijn ${participants.length} deelnemers in dit gesprek:
${participantLines.join('\n')}

**GEBRUIK DEZE EXACTE NAMEN als speaker labels!**
Het aantal unieke stemmen op het RECHTER kanaal is maximaal ${otherParticipantsCount}.
`;
    } else {
      const participantLines = participants.map((p: { index: number; name: string; isRecorder: boolean }) => {
        const displayName = p.name.trim() || `Speaker ${p.index}`;
        const channel = p.isRecorder ? 'LEFT channel' : 'RIGHT channel';
        const role = p.isRecorder ? ' (the recorder)' : '';
        return `- "${displayName}"${role} (${channel})`;
      });

      participantPromptSection = `
## PARTICIPANTS INFORMATION (IMPORTANT!)
There are ${participants.length} participants in this conversation:
${participantLines.join('\n')}

**USE THESE EXACT NAMES as speaker labels!**
The number of unique voices on the RIGHT channel is at most ${otherParticipantsCount}.
`;
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: API_KEY missing' });
  }

  const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.webm`);

  try {
    console.log('[Transcribe] Starting transcription process...');
    console.log(`[Transcribe] File URL: ${fileUrl.substring(0, 100)}...`);

    // 1. Download file from Supabase URL to temp storage
    console.log('[Transcribe] Downloading file from Supabase...');
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(tempFilePath);
      const protocol = fileUrl.startsWith('https') ? https : http;

      protocol.get(fileUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(new Error('Redirect without location header'));
            return;
          }
          console.log(`[Transcribe] Following redirect to: ${redirectUrl.substring(0, 100)}...`);
          const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
          redirectProtocol.get(redirectUrl, (redirectResponse) => {
            if (redirectResponse.statusCode !== 200) {
              reject(new Error(`Failed to download file: HTTP ${redirectResponse.statusCode}`));
              return;
            }
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', (err: Error) => {
            fs.unlink(tempFilePath, () => {});
            reject(err);
          });
        } else if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${response.statusCode}`));
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      }).on('error', (err: Error) => {
        fs.unlink(tempFilePath, () => {});
        reject(err);
      });
    });

    // Verify file was downloaded
    const fileStats = fs.statSync(tempFilePath);
    console.log(`[Transcribe] Downloaded file size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    if (fileStats.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    // 2. Initialize Google GenAI with the new unified SDK
    const ai = new GoogleGenAI({ apiKey });

    // 3. Upload file to Gemini using the Files API
    console.log('[Transcribe] Uploading to Gemini Files API...');
    const uploadedFile = await ai.files.upload({
      file: tempFilePath,
      config: {
        mimeType: mimeType || 'audio/webm',
        displayName: 'Meeting Recording'
      },
    });

    console.log(`[Transcribe] File uploaded: ${uploadedFile.name}`);
    console.log(`[Transcribe] Initial state: ${uploadedFile.state}`);

    // 4. Wait for file to become ACTIVE
    let fileInfo = await ai.files.get({ name: uploadedFile.name! });
    let waitCount = 0;
    const maxWait = 60; // Maximum 60 iterations (2 minutes with 2s intervals)

    while (fileInfo.state === 'PROCESSING' && waitCount < maxWait) {
      console.log(`[Transcribe] File state: ${fileInfo.state} (waiting ${waitCount * 2}s)...`);
      await sleep(2000);
      fileInfo = await ai.files.get({ name: uploadedFile.name! });
      waitCount++;
    }

    console.log(`[Transcribe] Final file state: ${fileInfo.state}`);

    if (fileInfo.state === 'FAILED') {
      throw new Error('Gemini failed to process the audio file. Please try again with a different recording.');
    }

    if (fileInfo.state !== 'ACTIVE') {
      throw new Error(`File processing timed out. State: ${fileInfo.state}`);
    }

    // 5. Build the transcription prompt
    const promptNL = `Je bent een professionele, ervaren notulist die vergaderingen transcribeert naar perfecte, goed leesbare documenten.
${participantPromptSection}
## AUDIO KANALEN (BELANGRIJK!)
De audio is opgenomen in STEREO:
- **LINKER KANAAL** = De gebruiker die opneemt
- **RECHTER KANAAL** = De andere deelnemers aan de vergadering/call

## SPREKERHERKENNING
1. Identificeer ALLE unieke sprekers op basis van:
   - Stereokanaal (links vs rechts)
   - Stemkenmerken (toonhoogte, spreekstijl)
   - Context uit het gesprek (namen die genoemd worden)
2. Geef elke spreker een consistente label:
   - Gebruik de opgegeven namen als die beschikbaar zijn (zie DEELNEMERS INFORMATIE hierboven)
   - Anders: "**Spreker 1:**", "**Spreker 2:**" etc. voor onbekende deelnemers
3. Wissel NOOIT willekeurig van label voor dezelfde persoon

## TRANSCRIPTIE KWALITEIT
1. **Spelling & Grammatica:** Corrigeer alle spelfouten en grammaticale fouten. Schrijf correcte Nederlandse zinnen.
2. **Leesbaarheid:** Maak de tekst vloeiend en goed leesbaar. Verwijder "uhm", "eh" tenzij relevant.
3. **Context:** Behoud de volledige betekenis en context van wat er gezegd wordt.
4. **Structuur:** Groepeer uitspraken van dezelfde spreker samen (niet elke zin apart).

## OUTPUT FORMAAT

### Transcriptie

**[Naam/Spreker]:** [Wat de persoon zegt, netjes geformuleerd]

**[Naam/Spreker]:** [Wat de andere persoon zegt, netjes geformuleerd]

[etc.]

---

## Samenvatting
[Bondige samenvatting van het gesprek in 2-4 zinnen: wat was het onderwerp en wat is de uitkomst]

## Actiepunten
- [ ] [Concreet actiepunt met wie verantwoordelijk is indien bekend]
- [ ] [Volgend actiepunt]

## Beslissingen
- [Beslissing die genomen is]
- [Volgende beslissing]

## Deelnemers
- [Lijst van geïdentificeerde deelnemers]

---
*Transcriptie gegenereerd door Vergader Notulist AI*`;

    const promptEN = `You are a professional, experienced meeting note-taker who transcribes meetings into perfect, readable documents.
${participantPromptSection}
## AUDIO CHANNELS (IMPORTANT!)
The audio was recorded in STEREO:
- **LEFT CHANNEL** = The user who is recording
- **RIGHT CHANNEL** = The other meeting/call participants

## SPEAKER RECOGNITION
1. Identify ALL unique speakers based on:
   - Stereo channel (left vs right)
   - Voice characteristics (pitch, speaking style)
   - Context from the conversation (names mentioned)
2. Give each speaker a consistent label:
   - Use the provided names if available (see PARTICIPANTS INFORMATION above)
   - Otherwise: "**Speaker 1:**", "**Speaker 2:**" etc. for unknown participants
3. NEVER randomly switch labels for the same person

## TRANSCRIPTION QUALITY
1. **Spelling & Grammar:** Correct all spelling and grammatical errors. Write proper English sentences.
2. **Readability:** Make the text fluent and easy to read. Remove "um", "uh" unless relevant.
3. **Context:** Preserve the full meaning and context of what is being said.
4. **Structure:** Group statements from the same speaker together (not each sentence separately).

## OUTPUT FORMAT

### Transcription

**[Name/Speaker]:** [What the person says, neatly formulated]

**[Name/Speaker]:** [What the other person says, neatly formulated]

[etc.]

---

## Summary
[Brief summary of the conversation in 2-4 sentences: what was the topic and what is the outcome]

## Action Items
- [ ] [Specific action item with who is responsible if known]
- [ ] [Next action item]

## Decisions
- [Decision that was made]
- [Next decision]

## Participants
- [List of identified participants]

---
*Transcription generated by Meeting Notes AI*`;

    // 6. Generate transcription using the uploaded file
    console.log('[Transcribe] Generating transcription...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: createUserContent([
        createPartFromUri(fileInfo.uri!, fileInfo.mimeType!),
        language === 'nl' ? promptNL : promptEN
      ]),
    });

    // Log the full response for debugging
    console.log('[Transcribe] Response received, extracting text...');
    console.log('[Transcribe] Response type:', typeof response);
    console.log('[Transcribe] Response keys:', response ? Object.keys(response) : 'null');

    // Try to get text from response - handle both getter and direct property
    let transcriptionText: string | undefined;

    try {
      // The SDK uses a getter, so access it directly
      transcriptionText = response.text;
    } catch {
      // Fallback to candidates structure
      if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
        transcriptionText = response.candidates[0].content.parts[0].text;
      }
    }

    console.log('[Transcribe] Transcription text length:', transcriptionText?.length || 0);
    console.log('[Transcribe] Transcription preview:', transcriptionText?.substring(0, 200) || 'EMPTY');

    if (!transcriptionText || transcriptionText.trim().length === 0) {
      console.error('[Transcribe] Empty transcription received from Gemini');
      console.error('[Transcribe] Full response:', JSON.stringify(response, null, 2).substring(0, 1000));
      throw new Error('Gemini returned empty transcription. The audio may be silent or unprocessable.');
    }

    console.log('[Transcribe] Transcription complete!');

    // 7. Cleanup - delete from Gemini and local temp file
    try {
      await ai.files.delete({ name: uploadedFile.name! });
      console.log('[Transcribe] Deleted file from Gemini');
    } catch (deleteErr) {
      console.warn('[Transcribe] Failed to delete file from Gemini:', deleteErr);
    }

    fs.unlink(tempFilePath, (err) => {
      if (err) console.warn('[Transcribe] Failed to delete temp file:', err);
    });

    return res.status(200).json({ text: transcriptionText });

  } catch (error: any) {
    console.error('[Transcribe] Error:', error);

    // Cleanup temp file on error
    fs.unlink(tempFilePath, () => {});

    // Provide more helpful error messages
    let errorMessage = error.message || 'Internal Server Error';

    if (errorMessage.includes('FAILED_PRECONDITION')) {
      errorMessage = 'The audio file could not be processed. Please ensure the recording is valid and try again.';
    } else if (errorMessage.includes('INVALID_ARGUMENT')) {
      errorMessage = 'Invalid audio format. Please use a supported format (WebM, MP3, WAV, etc.)';
    } else if (errorMessage.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    }

    return res.status(500).json({ error: errorMessage });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Set server-level timeouts for long transcription requests
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 620000; // Slightly longer than timeout
server.headersTimeout = 625000; // Slightly longer than keepAliveTimeout
