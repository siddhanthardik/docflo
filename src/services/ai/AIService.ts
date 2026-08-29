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
      let content = "";
      let promptTokens = 0;
      let completionTokens = 0;
      let totalTokens = 0;
      let providerName = "GEMINI";
      let modelName = "gemini-2.0-flash";

      if (provider.generateWithUsage) {
        const res = await provider.generateWithUsage(prompt, options);
        content = res.content;
        promptTokens = res.promptTokens;
        completionTokens = res.completionTokens;
        totalTokens = res.totalTokens;
        providerName = res.provider;
        modelName = res.model;
      } else {
        content = await provider.generateText(prompt, options);
        promptTokens = Math.ceil(prompt.length / 4);
        completionTokens = Math.ceil(content.length / 4);
        totalTokens = promptTokens + completionTokens;
      }

      // Calculate estimated cost in INR (₹)
      // Gemini 2.0 Flash: ~$0.10/1M input, $0.40/1M output * 85 INR/USD
      const costPerInputTokenInr = providerName === "OPENAI" ? (0.15 / 1000000) * 85 : (0.10 / 1000000) * 85;
      const costPerOutputTokenInr = providerName === "OPENAI" ? (0.60 / 1000000) * 85 : (0.40 / 1000000) * 85;
      const estimatedCostInr = (promptTokens * costPerInputTokenInr) + (completionTokens * costPerOutputTokenInr);

      // Record Telemetry Asynchronously (Non-blocking)
      prisma.aiTokenLog.create({
        data: {
          doctorId,
          feature: feature.toString(),
          provider: providerName,
          model: modelName,
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCostInr: Number(estimatedCostInr.toFixed(6)),
        }
      }).catch((err) => console.error("[Telemetry] Failed to log AI token usage:", err));

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
