import { prisma } from "@/lib/prisma";

export type FeatureType = "BOOLEAN" | "NUMBER";

export interface FeatureContext {
  isEnabled: boolean;
  limit: number | null;
}

/**
 * Resolves the configuration for a given feature key for a specific clinic (doctor).
 * Resolution order:
 * 1. Clinic Feature Override (highest priority)
 * 2. Package Feature
 * 3. Feature Flag Default Value (lowest priority)
 */
export async function getFeatureConfig(
  doctorId: string,
  featureKey: string
): Promise<FeatureContext> {
  // 1. Fetch the base FeatureFlag definition
  const featureFlag = await prisma.featureFlag.findUnique({
    where: { key: featureKey },
  });

  if (!featureFlag) {
    // If the feature doesn't even exist in the DB, default to disabled / zero
    return { isEnabled: false, limit: 0 };
  }

  // 2. Fetch Doctor with their active Package
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { packageId: true },
  });

  if (!doctor) {
    throw new Error(`Doctor with ID ${doctorId} not found`);
  }

  // 3. Check Clinic-Specific Overrides First
  const override = await prisma.clinicFeatureOverride.findUnique({
    where: {
      doctorId_featureId: {
        doctorId: doctorId,
        featureId: featureFlag.id,
      },
    },
  });

  if (override) {
    return {
      isEnabled: override.isEnabled,
      limit: featureFlag.type === "NUMBER" ? override.limit : null,
    };
  }

  // 4. Check Package Features
  if (doctor.packageId) {
    const pkgFeature = await prisma.packageFeature.findUnique({
      where: {
        packageId_featureId: {
          packageId: doctor.packageId,
          featureId: featureFlag.id,
        },
      },
    });

    if (pkgFeature) {
      return {
        isEnabled: pkgFeature.isEnabled,
        limit: featureFlag.type === "NUMBER" ? pkgFeature.limit : null,
      };
    }
  }

  // 5. Fallback to default values
  let defaultLimit = null;
  let defaultEnabled = false;

  if (featureFlag.type === "NUMBER") {
    defaultLimit = parseInt(featureFlag.defaultValue, 10);
    defaultEnabled = defaultLimit > 0;
  } else {
    defaultEnabled = featureFlag.defaultValue === "true";
  }

  return {
    isEnabled: defaultEnabled,
    limit: defaultLimit,
  };
}

/**
 * Helper to check if a boolean feature is enabled.
 */
export async function isFeatureEnabled(
  doctorId: string,
  featureKey: string
): Promise<boolean> {
  const config = await getFeatureConfig(doctorId, featureKey);
  return config.isEnabled;
}

/**
 * Helper to get the limit for a number feature.
 */
export async function getFeatureLimit(
  doctorId: string,
  featureKey: string
): Promise<number> {
  const config = await getFeatureConfig(doctorId, featureKey);
  return config.limit || 0;
}
