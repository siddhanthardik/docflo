import { AIFeature, AIGenerationOptions, AIProvider } from './types';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AICreditCosts } from '../../config/ai-credits';
import { EntitlementService, InsufficientAICreditsError } from '../entitlement.service';
import { prisma } from '../../lib/prisma';

export class AIService {
  private static provider: AIProvider;

  private static getProvider(): AIProvider {
    if (!this.provider) {
      const providerName = process.env.AI_PROVIDER || 'GEMINI';
      if (providerName === 'OPENAI') {
        this.provider = new OpenAIProvider();
      } else {
        this.provider = new GeminiProvider();
      }
    }
    return this.provider;
  }

  /**
   * Generates text using the configured AI provider, validating and deducting credits automatically.
   */
  static async generate(
    doctorId: string,
    feature: AIFeature,
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<{ content: string; creditsUsed: number; remainingCredits: number }> {
    // 1. Verify doctor has AI_ASSISTANT module
    await EntitlementService.requireModule(doctorId, 'AI_ASSISTANT', { route: 'AIService.generate' });

    // 2. Determine credit cost
    const creditCost = AICreditCosts[feature];

    // 3. Verify available credits
    const limitCheck = await EntitlementService.checkLimit(doctorId, 'AI_CREDITS_PER_MONTH');
    
    const mode = process.env.ENTITLEMENT_MODE || 'SHADOW';
    let deducted = false;
    
    if (mode !== 'OFF' && limitCheck.max !== null) {
      if (mode === 'ENFORCE') {
        // Atomic optimistic lock equivalent
        const result = await prisma.doctor.updateMany({
          where: {
            id: doctorId,
            currentAiCredits: { lte: limitCheck.max - creditCost }
          },
          data: { currentAiCredits: { increment: creditCost } }
        });

        if (result.count === 0) {
          throw new InsufficientAICreditsError(`Insufficient AI Credits. Requires ${creditCost}, but only ${limitCheck.max - limitCheck.current} remaining.`);
        }
        deducted = true;
      } else {
        // SHADOW mode
        if (limitCheck.current + creditCost > limitCheck.max) {
          await EntitlementService.logShadowViolation(
            doctorId,
            'AI_CREDITS_PER_MONTH',
            limitCheck.current + creditCost,
            limitCheck.max,
            `Insufficient AI Credits for ${feature}. Requires ${creditCost}.`
          );
        }
        await EntitlementService.incrementUsage(doctorId, 'AI_CREDITS_PER_MONTH', creditCost);
        deducted = true;
      }
    }

    // 4. Call selected AI provider
    const provider = this.getProvider();
    try {
      const content = await provider.generateText(prompt, options);

      // Determine remaining
      const newCurrent = mode !== 'OFF' ? limitCheck.current + creditCost : limitCheck.current;
      const remaining = limitCheck.max !== null ? Math.max(0, limitCheck.max - newCurrent) : -1;

      return {
        content,
        creditsUsed: creditCost,
        remainingCredits: remaining,
      };
    } catch (error) {
      // Refund credits if generation failed
      if (deducted) {
        await prisma.doctor.updateMany({
          where: { id: doctorId },
          data: { currentAiCredits: { decrement: creditCost } }
        });
      }
      throw error;
    }
  }
}
