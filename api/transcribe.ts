// @ts-nocheck
import { GoogleGenAI } from "@google/genai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

// NOTE: We use the Node-specific GoogleAIFileManager for file uploads
// and @google/genai for the generation.
// Ensure process.env.API_KEY is available in Vercel environment variables.

export default async function handler(req: any, res: any) {
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

  const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.webm`);

  try {
    // 1. Download file from Supabase URL to temp storage
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempFilePath);
      https.get(fileUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      }).on('error', (err) => {
        fs.unlink(tempFilePath, () => {});
        reject(err);
      });
    });

    // 2. Upload to Gemini File Manager
    // Note: We use the 'GoogleAIFileManager' from the server SDK here as it handles large file uploads robustly
    const fileManager = new GoogleAIFileManager(apiKey);
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: mimeType || 'audio/webm',
      displayName: 'Meeting Recording',
    });

    // 3. Generate Content using the File URI
    const ai = new GoogleGenAI({ apiKey });
    
    // We wait for the file to be active (usually instant for audio, but good practice)
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
            text: `Je bent een professionele notulist. Transcribeer de audio nauwkeurig in het Nederlands.
            
            BELANGRIJK VOOR SPREKER IDENTIFICATIE:
            De audio is opgenomen in stereo:
            - LINKER KANAAL: De hoofdgebruiker ('Ik').
            - RECHTER KANAAL: De vergadering ('Deelnemers').
            
            Instructies:
            1. Gebruik stereokanalen voor sprekeridentificatie.
            2. Formatteer als script:
               **Ik:** ...
               **Deelnemer:** ...
            3. Eindig met "**Samenvatting & Actiepunten**".`
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
    // Cleanup temp file if exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, () => {});
    }
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}