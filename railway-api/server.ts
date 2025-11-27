import express, { Request, Response } from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Transcribe endpoint
app.post('/api/transcribe', async (req: Request, res: Response) => {
  const { fileUrl, mimeType, participants } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ error: 'Missing fileUrl' });
  }

  // Build participant info for the prompt
  let participantPromptSection = '';
  if (participants && Array.isArray(participants) && participants.length > 0) {
    const participantLines = participants.map((p: { index: number; name: string; isRecorder: boolean }) => {
      const displayName = p.name.trim() || `Spreker ${p.index}`;
      const channel = p.isRecorder ? 'LINKER kanaal' : 'RECHTER kanaal';
      const role = p.isRecorder ? ' (de opnemer)' : '';
      return `- "${displayName}"${role} (${channel})`;
    });

    const otherParticipantsCount = participants.filter((p: { isRecorder: boolean }) => !p.isRecorder).length;

    participantPromptSection = `
## DEELNEMERS INFORMATIE (BELANGRIJK!)
Er zijn ${participants.length} deelnemers in dit gesprek:
${participantLines.join('\n')}

**GEBRUIK DEZE EXACTE NAMEN als speaker labels!**
Het aantal unieke stemmen op het RECHTER kanaal is maximaal ${otherParticipantsCount}.
`;
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: API_KEY missing' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const { GoogleAIFileManager } = await import('@google/generative-ai/server');

    const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.webm`);

    console.log(`[Transcribe] Downloading file from: ${fileUrl}`);

    // 1. Download file from Supabase URL to temp storage
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
          const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
          redirectProtocol.get(redirectUrl, (redirectResponse) => {
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', (err: Error) => {
            fs.unlink(tempFilePath, () => {});
            reject(err);
          });
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

    const fileStats = fs.statSync(tempFilePath);
    console.log(`[Transcribe] Downloaded file size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    // 2. Upload to Gemini File Manager
    console.log('[Transcribe] Uploading to Gemini...');
    const fileManager = new GoogleAIFileManager(apiKey);
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: mimeType || 'audio/webm',
      displayName: 'Meeting Recording',
    });

    // 3. Generate Content using the File URI
    const ai = new GoogleGenAI({ apiKey });

    // Wait for the file to be active
    console.log('[Transcribe] Waiting for Gemini to process file...');
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === 'PROCESSING') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(uploadResult.file.name);
      console.log(`[Transcribe] File state: ${file.state}`);
    }

    if (file.state === 'FAILED') {
      throw new Error('Audio processing failed by Gemini.');
    }

    console.log('[Transcribe] Starting transcription...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            fileData: {
              mimeType: uploadResult.file.mimeType,
              fileUri: uploadResult.file.uri
            }
          },
          {
            text: `Je bent een professionele, ervaren notulist die vergaderingen transcribeert naar perfecte, goed leesbare documenten.
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
*Transcriptie gegenereerd door Vergader Notulist AI*`
          }
        ]
      }
    });

    console.log('[Transcribe] Transcription complete!');

    // 4. Cleanup
    await fileManager.deleteFile(uploadResult.file.name);
    fs.unlink(tempFilePath, () => {});

    return res.status(200).json({ text: response.text });

  } catch (error: any) {
    console.error('[Transcribe] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
