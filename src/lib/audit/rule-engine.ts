export interface AuditRawData {
  gbp: {
    completeness: number; // 0-100
    reviewCount: number;
    rating: number;
    postsCount: number;
    photosCount: number;
  };
  website: {
    hasWebsite: boolean;
    hasSsl: boolean;
    mobileFriendly: boolean;
    hasSchema: boolean;
  };
  competitors: {
    averageRating: number;
    averageReviewCount: number;
  };
}

export function calculateDeterministicScores(data: AuditRawData) {
  // GBP Score Calculation (100 pts max)
  let gbpScore = 0;
  gbpScore += data.gbp.completeness * 0.4;
  gbpScore += Math.min((data.gbp.reviewCount / 100) * 30, 30); // Max 30 points for 100+ reviews
  gbpScore += data.gbp.rating >= 4.0 ? 15 : (data.gbp.rating >= 3.0 ? 5 : 0);
  gbpScore += data.gbp.postsCount >= 2 ? 10 : (data.gbp.postsCount === 1 ? 5 : 0);
  gbpScore += data.gbp.photosCount >= 5 ? 5 : 0;

  // Website Score Calculation (100 pts max)
  let websiteScore = 0;
  if (data.website.hasWebsite) {
    websiteScore += 20;
    if (data.website.hasSsl) websiteScore += 30;
    if (data.website.mobileFriendly) websiteScore += 30;
    if (data.website.hasSchema) websiteScore += 20;
  }

  // Competitor Score (100 pts max)
  let competitorScore = 50; // Baseline
  if (data.gbp.rating > data.competitors.averageRating) competitorScore += 25;
  else if (data.gbp.rating < data.competitors.averageRating) competitorScore -= 10;
  
  if (data.gbp.reviewCount > data.competitors.averageReviewCount) competitorScore += 25;
  else if (data.gbp.reviewCount < data.competitors.averageReviewCount) competitorScore -= 10;
  
  // Overall Score (Weighted Average)
  const overallScore = Math.round((gbpScore * 0.5) + (websiteScore * 0.3) + (competitorScore * 0.2));

  return {
    overallScore: Math.min(Math.max(overallScore, 0), 100),
    gbpScore: Math.round(Math.min(Math.max(gbpScore, 0), 100)),
    websiteScore: Math.round(Math.min(Math.max(websiteScore, 0), 100)),
    competitorScore: Math.round(Math.min(Math.max(competitorScore, 0), 100)),
    trustScore: Math.round(Math.min(data.gbp.rating * 20, 100)),
    eeatScore: data.website.hasSchema ? 100 : 30
  };
}
