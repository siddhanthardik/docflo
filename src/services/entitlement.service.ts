import { ModuleName, LimitName, PackageModule, PackageLimit } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';

export class ModuleAccessDeniedError extends Error {
  public status = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ModuleAccessDeniedError';
  }
}

export class UsageLimitExceededError extends Error {
  public status = 409;
  public limit: string;
  public allowed: number;
  public current: number;

  constructor(message: string, limit: string, allowed: number, current: number) {
    super(message);
    this.name = 'UsageLimitExceededError';
    this.limit = limit;
    this.allowed = allowed;
    this.current = current;
  }
}

export class InsufficientAICreditsError extends Error {
  public status = 409;
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientAICreditsError';
  }
}

export interface Entitlements {
  modules: ModuleName[];
  limits: Partial<Record<LimitName, number | null>>;
  packageId?: string | null;
  generatedAt?: number;
}

export interface EntitlementContext {
  route?: string;
  method?: string;
  requestId?: string;
  clinicId?: string;
}

export class EntitlementService {
  /**
   * Cached lookup of the doctor's currently assigned packageId.
   * This is invalidated using revalidateTag('doctor-package-${doctorId}') when assigned.
   */
  static async getDoctorPackageId(doctorId: string): Promise<string | null> {
    const getCachedDoctorPackage = unstable_cache(
      async (id: string) => {
        const doctor = await prisma.doctor.findUnique({
          where: { id },
          select: { packageId: true }
        });
        return doctor?.packageId || null;
      },
      [`doctor-package-${doctorId}`],
      { revalidate: 3600, tags: [`doctor-package-${doctorId}`] }
    );
    return getCachedDoctorPackage(doctorId);
  }

  /**
   * Retrieves the cached package entitlements for a doctor.
   */
  static async getEntitlements(doctorId: string): Promise<Entitlements> {
    const packageId = await this.getDoctorPackageId(doctorId);

    if (!packageId) {
      return { modules: [], limits: {}, packageId: null, generatedAt: Date.now() };
    }

    // Cache the package features and limits
    const getCachedPackage = unstable_cache(
      async (pkgId: string) => {
        const pkg = await prisma.package.findUnique({
          where: { id: pkgId },
          include: {
            modules: true,
            limits: true,
          }
        });
        
        if (!pkg) return { modules: [], limits: {}, packageId: null, generatedAt: Date.now() };

        const modules = pkg.modules.map((m: PackageModule) => m.moduleName);
        const limits = pkg.limits.reduce((acc: Partial<Record<LimitName, number | null>>, limit: PackageLimit) => {
          acc[limit.limitName] = limit.limitValue;
          return acc;
        }, {} as Partial<Record<LimitName, number | null>>);

        return { modules, limits, packageId: pkg.id, generatedAt: Date.now() };
      },
      [`package-entitlements-${packageId}`],
      { revalidate: 3600, tags: [`package-${packageId}`] }
    );

    return getCachedPackage(packageId);
  }

  /**
   * Returns true if the doctor has the given module.
   */
  static async hasModule(doctorId: string, module: ModuleName): Promise<boolean> {
    const mode = process.env.ENTITLEMENT_MODE || 'SHADOW';
    if (mode === 'OFF') return true;

    const { modules } = await this.getEntitlements(doctorId);
    return modules.includes(module);
  }

  /**
   * SHADOW/ENFORCE MODE support for modules.
   */
  static async requireModule(doctorId: string, module: ModuleName, context?: EntitlementContext): Promise<void> {
    const mode = process.env.ENTITLEMENT_MODE || 'SHADOW';
    if (mode === 'OFF') return;

    const start = Date.now();
    const { modules, packageId, generatedAt } = await this.getEntitlements(doctorId);
    const has = modules.includes(module);
    
    const cacheHit = generatedAt ? (Date.now() - generatedAt > 1000) : false;
    const evalTimeMs = Date.now() - start;

    if (!has) {
      const eventType = mode === 'ENFORCE' ? 'ENFORCED_BLOCK' : 'SHADOW_FAIL';
      try {
        await prisma.shadowEntitlementLog.create({
          data: {
            doctorId,
            packageId,
            module,
            route: context?.route,
            method: context?.method,
            requestId: context?.requestId,
            clinicId: context?.clinicId,
            reason: `Forbidden: Module ${module} not included in plan`,
            evalTimeMs,
            cacheHit,
            eventType
          }
        });
      } catch (e) {
        console.error("Shadow log write failed", e);
      }
      
      if (mode === 'ENFORCE') {
        throw new ModuleAccessDeniedError(`Your subscription does not include this feature.`);
      }
    }
  }

  /**
   * Helper to manually log shadow violations, useful for AI credits logic.
   */
  static async logShadowViolation(doctorId: string, limit: LimitName, current: number, max: number, reason: string): Promise<void> {
    try {
      const packageId = await this.getDoctorPackageId(doctorId);
      await prisma.shadowEntitlementLog.create({
        data: {
          doctorId,
          packageId,
          limit,
          currentUsage: current,
          allowedUsage: max,
          reason,
          eventType: 'SHADOW_FAIL'
        }
      });
    } catch (e) {
      console.error("Shadow log write failed", e);
    }
  }

  /**
   * Resolves the current usage for a given limit.
   */
  static async getCurrentUsage(doctorId: string, limit: LimitName): Promise<number> {
    switch (limit) {
      case 'MAX_STAFF_SEATS':
        return prisma.staffMember.count({ where: { doctorId } });
      case 'MAX_PATIENTS':
        return prisma.patient.count({ where: { doctorId } });
      case 'MAX_GBP_LOCATIONS':
        return prisma.gbpAccount.count({ where: { doctorId } });
      case 'MAX_SCHEDULED_POSTS':
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return prisma.gBPPost.count({ where: { doctorId, createdAt: { gte: startOfMonth } } });
      case 'AI_CREDITS_PER_MONTH':
        const doctorAi = await prisma.doctor.findUnique({
          where: { id: doctorId },
          select: { currentAiCredits: true }
        });
        return doctorAi?.currentAiCredits || 0;
      case 'MAX_TRACKED_KEYWORDS':
        // Sum the length of tracked keywords across all locations
        const accounts = await prisma.gbpAccount.findMany({
          where: { doctorId },
          select: { insightsData: true }
        });
        return accounts.reduce((acc: number, account: { insightsData: any }) => {
          const data = account.insightsData as any;
          if (data && Array.isArray(data.localSeoKeywords)) {
            return acc + data.localSeoKeywords.length;
          }
          return acc;
        }, 0);
      default:
        return 0;
    }
  }

  /**
   * Checks if the user is allowed to perform an action based on their limits.
   */
  static async checkLimit(doctorId: string, limit: LimitName): Promise<{ allowed: boolean, current: number, max: number | null }> {
    const mode = process.env.ENTITLEMENT_MODE || 'SHADOW';
    if (mode === 'OFF') {
      return { allowed: true, current: await this.getCurrentUsage(doctorId, limit), max: null };
    }

    const { limits } = await this.getEntitlements(doctorId);
    const max = limits[limit] !== undefined ? limits[limit]! : 0;
    
    if (max === null) {
      return { allowed: true, current: await this.getCurrentUsage(doctorId, limit), max: null };
    }

    const current = await this.getCurrentUsage(doctorId, limit);
    return {
      allowed: current < max,
      current,
      max
    };
  }

  /**
   * SHADOW/ENFORCE MODE support for limits.
   */
  static async requireLimit(doctorId: string, limit: LimitName, context?: EntitlementContext): Promise<void> {
    const mode = process.env.ENTITLEMENT_MODE || 'SHADOW';
    if (mode === 'OFF') return;

    const start = Date.now();
    const { limits, packageId, generatedAt } = await this.getEntitlements(doctorId);
    const max = limits[limit] !== undefined ? limits[limit]! : 0;
    
    if (max !== null) {
      const current = await this.getCurrentUsage(doctorId, limit);
      const cacheHit = generatedAt ? (Date.now() - generatedAt > 1000) : false;
      const evalTimeMs = Date.now() - start;

      if (current >= max) {
        const eventType = mode === 'ENFORCE' ? 'ENFORCED_BLOCK' : 'SHADOW_FAIL';
        try {
          await prisma.shadowEntitlementLog.create({
            data: {
              doctorId,
              packageId,
              limit,
              currentUsage: current,
              allowedUsage: max,
              route: context?.route,
              method: context?.method,
              requestId: context?.requestId,
              clinicId: context?.clinicId,
              reason: `Limit reached for ${limit}. Max allowed: ${max}`,
              evalTimeMs,
              cacheHit,
              eventType
            }
          });
        } catch (e) {
          console.error("Shadow log write failed", e);
        }

        if (mode === 'ENFORCE') {
          throw new UsageLimitExceededError(`Limit reached for ${limit}. Max allowed: ${max}`, limit, max, current);
        }
      }
    }
  }

  /**
   * Increments a consumption-based metric.
   */
  static async incrementUsage(doctorId: string, limit: LimitName, amount: number = 1): Promise<void> {
    if (limit === 'AI_CREDITS_PER_MONTH') {
      await prisma.doctor.update({
        where: { id: doctorId },
        data: { currentAiCredits: { increment: amount } }
      });
    } else if (limit === 'MAX_PATIENTS') {
       await prisma.doctor.update({
        where: { id: doctorId },
        data: { currentPatients: { increment: amount } }
       });
    }
  }
}
