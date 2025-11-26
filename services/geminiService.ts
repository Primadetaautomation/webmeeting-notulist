import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

/**
 * Converts a Blob to a Base64 string.
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the Data-URL declaration (e.g., "data:audio/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
    const base64Audio = await blobToBase64(audioBlob);

    // Using gemini-2.5-flash for speed and efficiency with audio
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type, // e.g., 'audio/webm' or 'audio/mp4'
              data: base64Audio
            }
          },
          {
            text: `Je bent een professionele notulist. Transcribeer de audio nauwkeurig in het Nederlands.
            
            BELANGRIJK VOOR SPREKER IDENTIFICATIE:
            De audio is opgenomen in stereo met een specifieke indeling:
            - LINKER KANAAL: De hoofdgebruiker ('Ik').
            - RECHTER KANAAL: De andere deelnemers in de online vergadering (Teams/Meet/etc.).
            
            Instructies:
            1. Gebruik de stereokanalen om onderscheid te maken tussen de gebruiker ('Ik') en de anderen.
            2. Als er meerdere mensen in het rechter kanaal (de vergadering) praten, probeer ze dan te onderscheiden als 'Deelnemer 1', 'Deelnemer 2', etc. op basis van hun stemgeluid.
            3. Formatteer de output als een helder script:
               **Ik:** [Tekst]
               **Deelnemer 1:** [Tekst]
               **Ik:** [Tekst]
            
            4. Eindig met een sectie "**Samenvatting & Actiepunten**" met bullet points.`
          }
        ]
      }
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("Geen transcriptie ontvangen van Gemini.");
    }

  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};