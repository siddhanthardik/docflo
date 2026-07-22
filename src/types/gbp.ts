export interface GbpCategory {
  displayName?: string;
}

export interface GbpCategories {
  primaryCategory?: GbpCategory;
  additionalCategories?: GbpCategory[];
}

export interface GbpSearchKeyword {
  keyword: string;
  views?: number;
}

export interface GbpAccountInsights {
  name?: string;
  formattedAddress?: string;
  rating?: number;
  user_ratings_total?: number;
  phone?: string;
  website?: string;
  placeId?: string | null;
  mapsUri?: string;
  newReviewUri?: string;
  totalViews?: number;
  searchViews?: number;
  mapsViews?: number;
  phoneCalls?: number;
  directionRequests?: number;
  websiteClicks?: number;
  directSearches?: number;
  discoverySearches?: number;
  totalActions?: number;
  searchKeywords?: GbpSearchKeyword[];
  categories?: GbpCategories | null;
  description?: string;
  regularHours?: Record<string, unknown> | null;
  accountName?: string;
  totalReviews?: number;
  photoCount?: number;
  postCount?: number;
  // Google API resource name (e.g. "locations/12345")
  locationName?: string;
  profileName?: string;
  // Performance trend deltas (populated by sync engine)
  viewsChange?: number;
  searchChange?: number;
  actionsChange?: number;
  totalSearches?: number;
  searchViews2?: number;
}

/**
 * GbpApiReview — review shape as returned by Google API (normalised for UI display).
 * Used in GbpAccount.recentReviews.
 */
export interface GbpApiReview {
  id: string;
  author_name: string;
  rating: number;
  text: string | null;
  replied: boolean;
  reply?: string | null;
  relative_time_description?: string;
}

/**
 * GbpDbReview — review shape as stored in the Prisma Review table.
 * Used wherever reviews are fetched from the DB and displayed in lists.
 */
export interface GbpDbReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  reply?: string | null;
  reviewDate: string;
  responded: boolean;
  source: string;
}

// Keep legacy alias for backward compatibility during migration
export type GbpRecentReview = GbpApiReview;

export interface GbpAccount {
  id: string;
  locationId: string | null;
  locationName: string | null;
  insights?: GbpAccountInsights;
  recentReviews?: GbpApiReview[];
}
