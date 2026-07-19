import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../ai/AIService';
import { AIFeature } from '../ai/types';
import { EntitlementService, InsufficientAICreditsError } from '../entitlement.service';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    doctor: {
      updateMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    }
  }
}));

vi.mock('../entitlement.service', () => {
  const checkLimit = vi.fn();
  const requireModule = vi.fn();
  const logShadowViolation = vi.fn();
  const incrementUsage = vi.fn();
  
  class InsufficientAICreditsError extends Error {
    public status = 409;
    constructor(message: string) {
      super(message);
      this.name = 'InsufficientAICreditsError';
    }
  }

  return {
    EntitlementService: {
      checkLimit,
      requireModule,
      logShadowViolation,
      incrementUsage,
    },
    InsufficientAICreditsError,
  };
});

// Mock Providers
vi.mock('../ai/providers/gemini.provider', () => {
  const GeminiProvider = vi.fn();
  GeminiProvider.prototype.generateText = vi.fn().mockResolvedValue('Mocked Gemini Response');
  return { GeminiProvider };
});

vi.mock('../ai/providers/openai.provider', () => {
  const OpenAIProvider = vi.fn();
  OpenAIProvider.prototype.generateText = vi.fn().mockResolvedValue('Mocked OpenAI Response');
  return { OpenAIProvider };
});

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENTITLEMENT_MODE = 'ENFORCE';
    process.env.AI_PROVIDER = 'GEMINI';
  });

  it('throws InsufficientAICreditsError if credits are exhausted in ENFORCE mode', async () => {
    vi.mocked(EntitlementService.checkLimit).mockResolvedValue({
      allowed: false,
      current: 100,
      max: 100
    });

    const { prisma } = await import('../../lib/prisma');
    vi.mocked(prisma.doctor.updateMany).mockResolvedValue({ count: 0 });

    await expect(AIService.generate('doc_1', AIFeature.REVIEW_REPLY, 'Hello'))
      .rejects
      .toThrow(InsufficientAICreditsError);
    
    expect(EntitlementService.incrementUsage).not.toHaveBeenCalled();
  });

  it('generates content and deducts credits if sufficient credits are available', async () => {
    vi.mocked(EntitlementService.checkLimit).mockResolvedValue({
      allowed: true,
      current: 50,
      max: 100
    });

    const { prisma } = await import('../../lib/prisma');
    vi.mocked(prisma.doctor.updateMany).mockResolvedValue({ count: 1 });

    const result = await AIService.generate('doc_1', AIFeature.REVIEW_REPLY, 'Hello');
    
    expect(result.content).toBe('Mocked Gemini Response');
    expect(result.creditsUsed).toBe(1); // REVIEW_REPLY cost = 1
    expect(result.remainingCredits).toBe(49);
  });

  it('does not deduct credits if provider generation fails', async () => {
    vi.mocked(EntitlementService.checkLimit).mockResolvedValue({
      allowed: true,
      current: 50,
      max: 100
    });

    // We can't easily mock the local instance returned inside the module but we can mock the class prototype if needed,
    // or just assume the error is thrown. Let's mock a rejection for this specific test case.
    const { GeminiProvider } = await import('../ai/providers/gemini.provider');
    // Override the prototype method for this test
    const originalMethod = GeminiProvider.prototype.generateText;
    GeminiProvider.prototype.generateText = vi.fn().mockRejectedValue(new Error('Provider Error'));

    // AIService uses a singleton, so we need to clear it or mock it.
    // Given the singleton, it might reuse the previous mock, so we might need to reset the provider.
    // For simplicity, we just check if it throws and doesn't call incrementUsage.

    // Let's force reset by dynamically importing and resetting.
    // Since we can't reset the private static property easily without bracket notation:
    (AIService as any).provider = undefined;

    await expect(AIService.generate('doc_1', AIFeature.REVIEW_REPLY, 'Hello'))
      .rejects
      .toThrow('Provider Error');
      
    // Restore the prototype method
    GeminiProvider.prototype.generateText = originalMethod;
      
    expect(EntitlementService.incrementUsage).not.toHaveBeenCalled();
  });

  it('switches to OpenAI if configured', async () => {
    process.env.AI_PROVIDER = 'OPENAI';
    (AIService as any).provider = undefined;

    vi.mocked(EntitlementService.checkLimit).mockResolvedValue({
      allowed: true,
      current: 50,
      max: 100
    });

    const { prisma } = await import('../../lib/prisma');
    vi.mocked(prisma.doctor.updateMany).mockResolvedValue({ count: 1 });

    const result = await AIService.generate('doc_1', AIFeature.REVIEW_REPLY, 'Hello');
    expect(result.content).toBe('Mocked OpenAI Response');
  });
});
