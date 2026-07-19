import { AIProvider, AIGenerationOptions } from '../types';
import OpenAI from 'openai';

export class OpenAIProvider implements AIProvider {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    this.model = 'gpt-4o-mini';
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const messages: any[] = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    });

    return response.choices[0]?.message?.content || '';
  }
}
