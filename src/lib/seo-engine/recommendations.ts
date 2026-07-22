import { NormalizedProfile } from "@/services/normalization/GoogleNormalizer";

export interface ActionCenterRecommendation {
  id: string;
  evidence: string;
  recommendation: string;
  expectedImpact: string;
  fixLink: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class RecommendationEngine {
  /**
   * Generates deterministic Action Center recommendations based strictly on the Normalized Google Profile.
   */
  static generateRecommendations(profile: NormalizedProfile): ActionCenterRecommendation[] {
    const recommendations: ActionCenterRecommendation[] = [];

    if (!profile.hasPhotos) {
      recommendations.push({
        id: "missing_photos",
        evidence: "Google returned 0 photos",
        recommendation: "Upload at least 10 clinic photos",
        expectedImpact: "Higher engagement and increased directions requests",
        fixLink: "/gbp/photos",
        priority: 'HIGH'
      });
    }

    if (!profile.description || profile.description.length < 100) {
      recommendations.push({
        id: "short_description",
        evidence: `Google returned a description of ${profile.description?.length || 0} characters`,
        recommendation: "Expand your business description to at least 500 characters",
        expectedImpact: "Better keyword matching in local search results",
        fixLink: "/gbp/profile/edit",
        priority: 'MEDIUM'
      });
    }

    if (!profile.website) {
      recommendations.push({
        id: "missing_website",
        evidence: "Google returned no website URL",
        recommendation: "Add your clinic's website URL",
        expectedImpact: "Direct patient traffic and online bookings",
        fixLink: "/gbp/profile/edit",
        priority: 'HIGH'
      });
    }

    if (profile.categories.length === 0) {
      recommendations.push({
        id: "missing_secondary_categories",
        evidence: "Google returned 0 secondary categories",
        recommendation: "Add at least 3 relevant secondary categories",
        expectedImpact: "Appearing in a wider variety of patient searches",
        fixLink: "/gbp/profile/edit",
        priority: 'MEDIUM'
      });
    }

    return recommendations;
  }
}
