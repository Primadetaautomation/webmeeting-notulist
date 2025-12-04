import type { VercelRequest, VercelResponse } from '@vercel/node';

// NOTE: This API route uses @google/generative-ai for server-side file uploads
// The file is downloaded from Supabase, uploaded to Gemini, and transcribed

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  try {
    // Dynamic imports for Node.js modules (Vercel serverless compatible)
    const { GoogleGenAI } = await import('@google/genai');
    const { GoogleAIFileManager } = await import('@google/generative-ai/server');
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const https = await import('https');

    const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.webm`);

    // 1. Download file from Supabase URL to temp storage
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(tempFilePath);

      // Handle both http and https
      const protocol = fileUrl.startsWith('https') ? https : require('http');

      protocol.get(fileUrl, (response: any) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          protocol.get(response.headers.location, (redirectResponse: any) => {
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

    // 2. Upload to Gemini File Manager
    const fileManager = new GoogleAIFileManager(apiKey);
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: mimeType || 'audio/webm',
      displayName: 'Meeting Recording',
    });

    // 3. Generate Content using the File URI
    const ai = new GoogleGenAI({ apiKey });

    // Wait for the file to be active
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === 'PROCESSING') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === 'FAILED') {
      throw new Error("Audio processing failed by Gemini.");
    }

    // Build the transcription prompt based on language
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
            text: language === 'nl' ? promptNL : promptEN
          }
        ]
      }
    });

    // 4. Cleanup
    // Delete file from Gemini (saves storage limits)
    await fileManager.deleteFile(uploadResult.file.name);
    // Delete local temp file
    fs.unlink(tempFilePath, () => {});

    return res.status(200).json({ text: response.text });

  } catch (error: any) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
