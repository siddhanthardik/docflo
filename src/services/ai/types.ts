export enum AIFeature {
  REVIEW_REPLY = 'REVIEW_REPLY',
  WHATSAPP_REPLY = 'WHATSAPP_REPLY',
  GBP_POST = 'GBP_POST',
  SEO_OPTIMIZATION = 'SEO_OPTIMIZATION',
  BLOG_GENERATION = 'BLOG_GENERATION',
  CLINIC_AUDIT = 'CLINIC_AUDIT',
}

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  imageUrl?: string;
}

export interface AIGenerationResult {
  content: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIProvider {
  generateText(prompt: string, options?: AIGenerationOptions): Promise<string>;
  generateWithUsage?(prompt: string, options?: AIGenerationOptions): Promise<AIGenerationResult>;
}
