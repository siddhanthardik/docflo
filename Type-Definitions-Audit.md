# Type Definitions Audit

> Last updated: 2026-07-20
> TypeScript: ✅ Zero errors after consolidation

---

## Summary of Findings

| Type Name | Occurrences | Canonical Location | Final Status |
|---|---|---|---|
| `GbpAccount` | 3 (LocationContext local, GBPNormalizedAccount alias, canonical) | `src/types/gbp.ts` | ✅ Consolidated |
| `GBPInsights` / `GbpAccountInsights` | 3 duplicates | `src/types/gbp.ts → GbpAccountInsights` | ✅ Consolidated |
| `GBPReview` / `Review` / `GbpRecentReview` | 3 duplicates | `src/types/gbp.ts → GbpDbReview` | ✅ Consolidated |
| `GBPAccount` (Google API shape) | 1 — local to `gbp.service.ts` | Internal impl detail | ℹ️ No action (different concept) |
| `GBPLocation` (Google API shape) | 1 — local to `gbp.service.ts` | Internal impl detail | ℹ️ No action (different concept) |
| `NormalizedProfile` | 1 — only in `GoogleNormalizer.ts` | Already canonical | ✅ No duplicate |
| `LocationContextType` | 1 — only in `LocationContext.tsx` | Already canonical | ✅ No duplicate |
| `SEOOverview` | 0 found | N/A | ✅ Not defined |
| `GoogleProfile` / `GoogleLocation` / `ProfileInsights` | 0 found | N/A | ✅ Not defined |

---

## Canonical Type Registry

All canonical GBP types live in **`src/types/gbp.ts`** and are barrel-exported from **`src/types/index.ts`**.

| Type | Purpose | Consumers |
|---|---|---|
| `GbpAccount` | Normalized account shape for UI/context | `LocationContext`, `gbp/page.tsx`, `gbp/audit/page.tsx`, `reviews/page.tsx` |
| `GbpAccountInsights` | Insights blob stored in `GbpAccount.insightsData` | `gbp.service.ts` (via alias), `use-gbp.ts` (via alias) |
| `GbpApiReview` | Review shape from Google API (normalised) | `GbpAccount.recentReviews` |
| `GbpRecentReview` | Backward-compat alias for `GbpApiReview` | Legacy consumers |
| `GbpDbReview` | Review shape from Prisma `Review` table | `reviews-list.tsx` (via alias), `use-gbp.ts` (via alias) |
| `GbpCategories` | Google category structure | Used inside `GbpAccountInsights` |
| `GbpCategory` | Single category entry | Used inside `GbpCategories` |
| `GbpSearchKeyword` | Keyword + view count | Used inside `GbpAccountInsights` |
| `GBPNormalizedAccount` | Alias for `GbpAccount` | `googleBusinessProfile.service.ts` |

---

## Duplicate 1: GBPInsights — Resolved

### Was: 3 separate definitions

**Definition A — `src/services/gbp.service.ts`** (private, deleted)
```ts
interface GBPInsights {
  locationName: string;
  profileName?: string;
  totalSearches: number;
  directSearches: number;
  discoverySearches: number;
  totalViews: number;
  searchViews: number;
  mapsViews: number;
  totalActions: number;
  websiteClicks: number;
  phoneCalls: number;
  directionRequests: number;
  searchKeywords?: any[];
  viewsChange?: number;
  searchChange?: number;
  actionsChange?: number;
}
```

**Definition B — `src/hooks/use-gbp.ts`** (private, deleted)
```ts
interface GBPInsights {
  locationName: string;
  totalSearches: number;
  directSearches: number;
  discoverySearches: number;
  totalViews: number;
  searchViews: number;
  mapsViews: number;
  totalActions: number;
  websiteClicks: number;
  phoneCalls: number;
  directionRequests: number;
}
```

### Now: Both import from canonical

```ts
// gbp.service.ts and use-gbp.ts
import type { GbpAccountInsights as GBPInsights } from "@/types/gbp";
```

---

## Duplicate 2: Review — Resolved

### Was: 3 separate definitions

**Definition A — `src/components/gbp/reviews-list.tsx`** (private, deleted)
```ts
interface Review {
  id: string;
  reviewerName: string;  // DB field name
  rating: number;
  comment: string;       // DB field name
  reply?: string;
  reviewDate: string;
  responded: boolean;    // DB field name
  source: string;
}
```

**Definition B — `src/hooks/use-gbp.ts`** (private, deleted — identical to A)
```ts
interface GBPReview { /* same fields as Review */ }
```

**Definition C — `src/types/gbp.ts → GbpRecentReview`** (API shape — kept but renamed)
```ts
export interface GbpApiReview {
  id: string;
  author_name: string;   // Google API field name
  rating: number;
  text: string | null;   // Google API field name
  replied: boolean;      // Google API field name
  reply?: string | null;
  relative_time_description?: string;
}
```

### Two distinct shapes — both canonical

| Shape | Type | When to use |
|---|---|---|
| DB shape | `GbpDbReview` | Fetching from Prisma `Review` table |
| API shape | `GbpApiReview` | Google API response / `GbpAccount.recentReviews` |

### Now: Both import from canonical

```ts
// reviews-list.tsx
import type { GbpDbReview as Review } from "@/types/gbp";

// use-gbp.ts
import type { GbpDbReview as GBPReview } from "@/types/gbp";
```

---

## Duplicate 3: GbpAccount — Resolved (Previous Session)

### Was: 3 separate definitions

- `src/contexts/LocationContext.tsx` — private 3-field stub (id, locationName, locationId)
- `src/services/googleBusinessProfile.service.ts` — `GBPNormalizedAccount` with `any` fields
- `src/types/gbp.ts` — canonical fully-typed definition

### Now: Single canonical

```ts
// src/types/gbp.ts
export interface GbpAccount {
  id: string;
  locationId: string | null;
  locationName: string | null;
  insights?: GbpAccountInsights;
  recentReviews?: GbpApiReview[];
}

// googleBusinessProfile.service.ts
export type GBPNormalizedAccount = GbpAccount;

// LocationContext.tsx
import { GbpAccount } from "@/types/gbp";
export type { GbpAccount };
```

---

## Already Canonical — No Action Needed

| Type | File | Notes |
|---|---|---|
| `NormalizedProfile` | `src/services/normalization/GoogleNormalizer.ts` | Only defined once, properly imported by `recommendations.ts` |
| `LocationContextType` | `src/contexts/LocationContext.tsx` | Only defined once |
| `GBPAccount` (Google API) | `src/services/gbp.service.ts` | Represents Google Account Management API response — different concept from DB `GbpAccount` |
| `GBPLocation` (Google API) | `src/services/gbp.service.ts` | Represents Google Business Information API response |
| `ActionCenterRecommendation` | `src/lib/seo-engine/recommendations.ts` | Only defined once |
| `InsightsAttention/Today/Growth/Capacity` | `src/lib/insights/types.ts` | Application-level insights — unrelated to GBP |
