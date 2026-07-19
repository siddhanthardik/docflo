import { AIFeature } from '../services/ai/types';

export const AICreditCosts: Record<AIFeature, number> = {
  [AIFeature.REVIEW_REPLY]: 1,
  [AIFeature.WHATSAPP_REPLY]: 1,
  [AIFeature.GBP_POST]: 2,
  [AIFeature.SEO_OPTIMIZATION]: 5,
  [AIFeature.BLOG_GENERATION]: 10,
  [AIFeature.CLINIC_AUDIT]: 20,
};
