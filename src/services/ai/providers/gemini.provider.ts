import { AIProvider, AIGenerationOptions } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite'
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout of ${timeoutMs}ms exceeded for ${label}`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

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
        const generatePromise = model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig,
        });

        const result = await withTimeout(generatePromise, 4000, modelName);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const errText = err.message || err.toString() || "";
        console.warn(`[GeminiProvider] Model ${modelName} failed/timed out (${errText}).`);

        // Fast failover immediately on 429 Quota Exceeded
        if (/429|quota|resourceexhausted|too many requests/i.test(errText)) {
          console.warn(`[GeminiProvider] ⚡ Gemini 429 Quota Limit detected. Triggering instant failover to OpenAI...`);
          break;
        }
      }
    }

    // Secondary automatic fallback to OpenAI gpt-4o-mini if Gemini is unavailable
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        console.log("[GeminiProvider] Falling back to OpenAI gpt-4o-mini...");
        const openai = new OpenAI({ apiKey: openaiKey });
        const openaiPromise = openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: finalPrompt }],
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
        });
        const completion = await withTimeout(openaiPromise, 4000, "OpenAI gpt-4o-mini");
        const content = completion.choices[0]?.message?.content?.trim();
        if (content) return content;
      } catch (oErr) {
        console.error("[GeminiProvider] OpenAI fallback also failed/timed out:", oErr);
      }
    }

    throw lastError || new Error("All Gemini and fallback AI models are currently unavailable.");
  }

  async generateWithUsage(prompt: string, options?: AIGenerationOptions): Promise<import('../types').AIGenerationResult> {
    const generationConfig = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 1024,
    };

    let finalPrompt = prompt;
    if (options?.systemPrompt) {
      finalPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const parts: any[] = [{ text: finalPrompt }];

    if (options?.imageUrl) {
      try {
        let imageUrl = options.imageUrl;
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
        const content = response.text() || '';
        const usage = (response as any).usageMetadata;

        const promptTokens = usage?.promptTokenCount || Math.ceil(finalPrompt.length / 4);
        const completionTokens = usage?.candidatesTokenCount || Math.ceil(content.length / 4);
        const totalTokens = usage?.totalTokenCount || (promptTokens + completionTokens);

        return {
          content,
          provider: 'GEMINI',
          model: modelName,
          promptTokens,
          completionTokens,
          totalTokens,
        };
      } catch (err: any) {
        lastError = err;
        const errText = err.message || err.toString() || "";
        console.warn(`[GeminiProvider] Model ${modelName} failed (${errText}). Downgrading to next candidate...`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
    }

    // Secondary automatic fallback to OpenAI gpt-4o-mini for generateWithUsage
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        console.log("[GeminiProvider] generateWithUsage falling back to OpenAI gpt-4o-mini...");
        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: finalPrompt }],
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
        });
        const content = completion.choices[0]?.message?.content?.trim() || "";
        const promptTokens = completion.usage?.prompt_tokens || Math.ceil(finalPrompt.length / 4);
        const completionTokens = completion.usage?.completion_tokens || Math.ceil(content.length / 4);
        const totalTokens = completion.usage?.total_tokens || (promptTokens + completionTokens);

        return {
          content,
          provider: 'OPENAI',
          model: 'gpt-4o-mini',
          promptTokens,
          completionTokens,
          totalTokens,
        };
      } catch (oErr) {
        console.error("[GeminiProvider] OpenAI generateWithUsage fallback also failed:", oErr);
      }
    }

    throw lastError || new Error("All Gemini and fallback models in downgrade cascade are currently unavailable.");
  }
}
