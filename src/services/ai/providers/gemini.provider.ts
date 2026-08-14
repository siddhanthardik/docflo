import { AIProvider, AIGenerationOptions } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = 'gemini-1.5-flash';
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.model });
    
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
        let base64Data = "";
        let mimeType = "image/jpeg";

        if (options.imageUrl.startsWith("data:")) {
          const matches = options.imageUrl.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        } else if (options.imageUrl.startsWith("http://") || options.imageUrl.startsWith("https://")) {
          const imgRes = await fetch(options.imageUrl);
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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig,
    });

    const response = await result.response;
    return response.text();
  }
}
