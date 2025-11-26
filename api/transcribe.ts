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

  const { fileUrl, mimeType } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ error: 'Missing fileUrl' });
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

## AUDIO KANALEN (BELANGRIJK!)
De audio is opgenomen in STEREO:
- **LINKER KANAAL** = De gebruiker die opneemt (label: "Ik" of gebruik de naam als die genoemd wordt)
- **RECHTER KANAAL** = De andere deelnemers aan de vergadering/call

## SPREKERHERKENNING
1. Identificeer ALLE unieke sprekers op basis van:
   - Stereokanaal (links vs rechts)
   - Stemkenmerken (toonhoogte, spreekstijl)
   - Context uit het gesprek (namen die genoemd worden)
2. Geef elke spreker een consistente label:
   - "**Ik:**" voor de persoon op het linker kanaal
   - "**[Naam]:**" als een naam genoemd wordt
   - "**Spreker 1:**", "**Spreker 2:**" etc. voor onbekende deelnemers
3. Wissel NOOIT willekeurig van label voor dezelfde persoon

## TRANSCRIPTIE KWALITEIT
1. **Spelling & Grammatica:** Corrigeer alle spelfouten en grammaticale fouten. Schrijf correcte Nederlandse zinnen.
2. **Leesbaarheid:** Maak de tekst vloeiend en goed leesbaar. Verwijder "uhm", "eh" tenzij relevant.
3. **Context:** Behoud de volledige betekenis en context van wat er gezegd wordt.
4. **Structuur:** Groepeer uitspraken van dezelfde spreker samen (niet elke zin apart).

## OUTPUT FORMAAT

### Transcriptie

**Ik:** [Wat de gebruiker zegt, netjes geformuleerd]

**[Spreker]:** [Wat de andere persoon zegt, netjes geformuleerd]

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
- [Lijst van geïdentificeerde deelnemers indien bekend]

---
*Transcriptie gegenereerd door Vergader Notulist AI*`
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
