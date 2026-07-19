import { AIProvider, AIGenerationOptions } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_CLIENT_SECRET || process.env.GEMINI_API_KEY || '');
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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig,
    });

    const response = await result.response;
    return response.text();
  }
}
