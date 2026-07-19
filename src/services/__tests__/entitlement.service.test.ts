import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  EntitlementService, 
  ModuleAccessDeniedError, 
  UsageLimitExceededError,
  InsufficientAICreditsError
} from '../entitlement.service';
import { prisma } from '@/lib/prisma';

// Mock Next.js cache and navigation
vi.mock('next/cache', () => ({
  unstable_cache: (cb: any) => cb,
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    doctor: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    package: {
      findUnique: vi.fn()
    },
    staffMember: { count: vi.fn() },
    patient: { count: vi.fn() },
    gbpAccount: { count: vi.fn(), findMany: vi.fn() },
    gBPPost: { count: vi.fn() },
    shadowEntitlementLog: {
      create: vi.fn()
    }
  }
}));

describe('EntitlementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENTITLEMENT_MODE = 'ENFORCE'; // Default to enforce for most tests
  });

  describe('requireModule', () => {
    it('throws ModuleAccessDeniedError if doctor lacks module in ENFORCE mode', async () => {
      vi.mocked(prisma.doctor.findUnique).mockResolvedValue({ packageId: 'pkg_1' } as any);
      vi.mocked(prisma.package.findUnique).mockResolvedValue({
        id: 'pkg_1',
        modules: [{ moduleName: 'CLINIC_CORE' }],
        limits: []
      } as any);

      await expect(EntitlementService.requireModule('doc_1', 'GROWTH_SEO'))
        .rejects
        .toThrow(ModuleAccessDeniedError);
    });

    it('does not throw and logs SHADOW_FAIL in SHADOW mode', async () => {
      process.env.ENTITLEMENT_MODE = 'SHADOW';
      vi.mocked(prisma.doctor.findUnique).mockResolvedValue({ packageId: 'pkg_1' } as any);
      vi.mocked(prisma.package.findUnique).mockResolvedValue({
        id: 'pkg_1',
        modules: [{ moduleName: 'CLINIC_CORE' }],
        limits: []
      } as any);

      await expect(EntitlementService.requireModule('doc_1', 'GROWTH_SEO'))
        .resolves
        .toBeUndefined();
      
      expect(prisma.shadowEntitlementLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'SHADOW_FAIL',
            module: 'GROWTH_SEO'
          })
        })
      );
    });
  });

  describe('requireLimit', () => {
    it('throws UsageLimitExceededError if limit is reached in ENFORCE mode', async () => {
      vi.mocked(prisma.doctor.findUnique).mockResolvedValue({ packageId: 'pkg_1' } as any);
      vi.mocked(prisma.package.findUnique).mockResolvedValue({
        id: 'pkg_1',
        modules: [],
        limits: [{ limitName: 'MAX_STAFF_SEATS', limitValue: 2 }]
      } as any);

      // Mock current usage to be 2 (already at max)
      vi.mocked(prisma.staffMember.count).mockResolvedValue(2);

      await expect(EntitlementService.requireLimit('doc_1', 'MAX_STAFF_SEATS'))
        .rejects
        .toThrow(UsageLimitExceededError);
    });

    it('passes successfully if below limit', async () => {
      vi.mocked(prisma.doctor.findUnique).mockResolvedValue({ packageId: 'pkg_1' } as any);
      vi.mocked(prisma.package.findUnique).mockResolvedValue({
        id: 'pkg_1',
        modules: [],
        limits: [{ limitName: 'MAX_STAFF_SEATS', limitValue: 2 }]
      } as any);

      // Mock current usage to be 1 (below max)
      vi.mocked(prisma.staffMember.count).mockResolvedValue(1);

      await expect(EntitlementService.requireLimit('doc_1', 'MAX_STAFF_SEATS'))
        .resolves
        .toBeUndefined();
    });

    it('does not throw and logs SHADOW_FAIL in SHADOW mode', async () => {
      process.env.ENTITLEMENT_MODE = 'SHADOW';
      vi.mocked(prisma.doctor.findUnique).mockResolvedValue({ packageId: 'pkg_1' } as any);
      vi.mocked(prisma.package.findUnique).mockResolvedValue({
        id: 'pkg_1',
        modules: [],
        limits: [{ limitName: 'MAX_STAFF_SEATS', limitValue: 2 }]
      } as any);

      vi.mocked(prisma.staffMember.count).mockResolvedValue(2);

      await expect(EntitlementService.requireLimit('doc_1', 'MAX_STAFF_SEATS'))
        .resolves
        .toBeUndefined();
        
      expect(prisma.shadowEntitlementLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'SHADOW_FAIL',
            limit: 'MAX_STAFF_SEATS'
          })
        })
      );
    });
  });
});
