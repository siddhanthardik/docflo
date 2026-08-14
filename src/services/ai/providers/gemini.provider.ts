import { AIProvider, AIGenerationOptions } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    // Convert options to Gemini specific generation config
    const generationConfig = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 1024,
    };

    let finalPrompt = prompt;
    if (options?.systemPrompt) {
      finalPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const parts: any[] = [{ text: finalPrompt }];

    // If an image URL is provided, fetch and attach inline image data for multimodal vision analysis
    if (options?.imageUrl) {
      try {
        let imageUrl = options.imageUrl;

        // Resolve relative upload paths to absolute URLs for Node.js fetch
        if (imageUrl.startsWith("/")) {
          const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          imageUrl = `${baseUrl}${imageUrl}`;
        }

        let base64Data = "";
        let mimeType = "image/jpeg";

        if (imageUrl.startsWith("data:")) {
          const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
          const imgRes = await fetch(imageUrl);
          if (imgRes.ok) {
            const arrayBuf = await imgRes.arrayBuffer();
            base64Data = Buffer.from(arrayBuf).toString("base64");
            mimeType = imgRes.headers.get("content-type") || "image/jpeg";
          }
        }

        if (base64Data) {
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType,
            },
          });
        }
      } catch (e) {
        console.warn("Could not load image for Gemini vision processing:", e);
      }
    }

    let lastError: any = null;
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig,
        });

        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const errText = err.message || err.toString() || "";
        console.warn(`[GeminiProvider] Model ${modelName} failed (${errText}). Downgrading to next candidate...`);

        // Short 300ms backoff before trying next candidate model in downgrade order
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
    }

    throw lastError || new Error("All Gemini models in downgrade cascade are currently unavailable.");
  }
}
