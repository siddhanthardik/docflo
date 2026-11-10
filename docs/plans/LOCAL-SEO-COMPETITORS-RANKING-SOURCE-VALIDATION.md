# GYREX LOCAL SEO — PHASE 0.5
## RANKING SOURCE VALIDATION & DATA ARCHITECTURE REVIEW

> **Document Type**: Technical Evaluation & Architecture Recommendation  
> **Status**: Review & Explicit Approval Pending (Read-Only Investigation — No Code/DB Changes)  
> **Target Subsystem**: Gyrex Local SEO Competitors & Ranking Engine  
> **Preceding Deliverable**: `docs/plans/LOCAL-SEO-COMPETITORS-REDESIGN-AUDIT-AND-IMPLEMENTATION-PLAN.md`  
> **Execution Constraint**: AUDIT AND PLAN ONLY. NO CODE OR DATABASE MODIFICATIONS.

---

## 1. PROVIDER COMPARISON MATRIX

This matrix evaluates ranking and discovery data sources against Gyrex's product requirements:
- **Near Me Competitors**: 5 km radius physical discovery around clinic GBP coordinates.
- **Keyword Ranking Report**: Monitored top-20 leaderboard for an exact keyword query in a defined market.

| Dimension | Google Places API (New: `places:searchText`) | Gyrex GeoGrid (`unifiedGeoGrid`) | DataForSEO (Google Maps SERP API) | BrightLocal API | Local Falcon API | ValueSERP / SerpApi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Real Consumer Google Maps SERP?** | **NO** (Developer API relevance/distance sort) | **NO** (Samples 25 classic `nearbysearch` pins) | **YES** (Direct scrape of consumer Google Maps SERP) | **YES** (Consumer Maps / Local Pack) | **YES** (Consumer Maps Grid) | **YES** (Direct scrape of Google Maps) |
| **Exact Keyword Queries?** | Re-interpreted / synonym expansion by API | Passed to `keyword` at each pin | **YES** (Verbatim search query) | **YES** | **YES** | **YES** |
| **Explicit Search Locations?** | `locationBias` (circular or rectangular box) | Clinic coordinates as center pin | `location_name` or `location_coordinate` | City / postal code / coordinates | Center pin + radius | `ll` coordinates or location string |
| **Top 20 Businesses Retrieval?** | Up to 20 per page (`maxResultCount: 20`) | **NO** (Discards competitors, keeps clinic only) | **YES** (Ranks #1 through #20+) | Yes (Top 20/50) | Ranks per pin (1–20) | **YES** (Top 20 per page) |
| **Returns Google Place IDs?** | **YES** (native `id`) | **YES** (Classic `place_id`) | **YES** (`place_id`, `cid`) | **YES** | **YES** | **YES** (`place_id`, `data_id`) |
| **Historical Ranking Data?** | **NO** (Live snapshot only) | Locally in `SearchGridSnapshot` | Past task archives available via API | Built-in SaaS history | Built-in SaaS history | No (Requires local storage) |
| **API Availability?** | Public Google Cloud REST | Internal Gyrex endpoint | RESTful JSON (Live & Webhook) | Enterprise gated | RESTful API on paid tiers | RESTful JSON |
| **Pricing Model** | \$35.00 / 1,000 queries (Text Search Pro) | 25 calls x \$0.032 = **\$0.80 per scan** | **\$2.00 – \$4.00 / 1,000 queries** (\$0.002–\$0.004/ea) | Subscription (\$39–\$79+/mo) + Enterprise API | Credit subscription (\$24.99–\$199+/mo) | \$1.50 – \$10.00 / 1,000 queries |
| **Licensing / Terms** | Google Maps Platform ToS (30-day cache limit) | Google Maps Platform ToS | Permitted for SaaS dashboards | Terms restrict redistribution | Tailored for internal SEO reporting | Permitted for SaaS dashboards |
| **Integration Effort** | **LOW** (Already present in codebase) | **HIGH** to re-engineer into linear top 20 | **MEDIUM** (Clean, standard REST API) | **HIGH** (Enterprise onboarding) | **HIGH** (Designed for grids, not linear lists) | **MEDIUM** |

---

## 2. RECOMMENDED RANKING ARCHITECTURE

### The Two-Engine Decoupled Architecture

We recommend separating the data architecture into two specialized pipelines:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         GYREX LOCAL SEO COMPETITORS                          │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌─────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│     ENGINE 1: NEAR ME COMPETITORS       │   │    ENGINE 2: KEYWORD RANKING REPORT    │
├─────────────────────────────────────────┤   ├────────────────────────────────────────┤
│ • Capability: 5 KM Nearby Discovery     │   │ • Capability: Top 20 SERP Leaderboard  │
│ • Primary Source: Google Places API     │   │ • Immediate/Interim Source:            │
│   (places:searchNearby)                 │   │   Google Places Text Search            │
│ • Rationale: 100% compliant, native 5km │   │   (with transparent benchmark label)   │
│   radius, healthcare primary types,     │   │ • Future Long-Term Parity Source:      │
│   already implemented in Gyrex.         │   │   DataForSEO Google Maps SERP API      │
│ • Output: Distance, Reviews, Rating     │   │ • Output: Verbatim Query, Explicit     │
│   (Strictly NO misleading rank badges)  │   │   Market, Top 20 Ranks, Place ID match │
└─────────────────────────────────────────┘   └────────────────────────────────────────┘
```

### Why This Approach Was Chosen
1. **Near Me Competitors**: Google Places API New (`places:searchNearby`) is already fully wired in [`src/lib/google-providers/GooglePlacesProvider.ts`](file:///d:/gyrex/src/lib/google-providers/GooglePlacesProvider.ts#L80-L125). It natively supports `locationRestriction` with a strict 5 km radius and healthcare primary types. It requires **zero external subscriptions** and provides exact physical proximity.
2. **Keyword Ranking Report**:
   - **Immediate / Phase 1**: Use Google Places API Text Search (`places:searchText`), but **eliminate all query mutations**, enforce explicit search market coordinates, and display it with honest transparency: *"Monitored Google Places Benchmark (Top 20)"*.
   - **Long-Term Upgrade Path (Phase 2)**: Integrate **DataForSEO Google Maps API** when exact consumer SERP parity is mandated. At \$0.002 per search, DataForSEO is 17x cheaper than Google Places API (\$0.035) and returns the genuine consumer Google Maps organic list without distance-bias distortion.
3. **Rejection of GeoGrid Extension for Top 20**: The existing GeoGrid (`unifiedGeoGrid`) is fundamentally a 25-point spatial matrix. Trying to convert 25 individual pin results into a single linear "Top 20 in South Delhi" list creates insurmountable semantic problems (e.g., Which pin wins? Why does pin (0,0) differ from pin (2,2)?). Furthermore, at \$0.80 per scan (25 calls), it is economically unviable for frequent keyword monitoring.

---

## 3. EVIDENCE AND TECHNICAL LIMITATIONS

### Documented Distinction: Places API vs Consumer Google Maps SERP
- **Places API Text Search (`places:searchText`)**:
  - Purpose: Developer directory search for places matching a string.
  - Sorting: Google applies algorithmic scoring combining text match, user-defined circular distance bias, and global prominence.
  - Evidence: When querying `"Best Hernia Surgeon in Delhi"`, Places API heavily weighs the center coordinates of the bias circle. If biased at South Delhi, a clinic in North Delhi with 500 reviews may be omitted in favor of a closer clinic with 10 reviews.
  - **Verdict**: Suitable as an objective directory visibility benchmark, but cannot claim to be identical to what a user sees in the Google Maps browser app.
- **Consumer Google Maps**:
  - Evaluates local pack ranking algorithms (prominence, relevance, distance from user viewport), organic web citations, and personalized browsing signals.
  - DataForSEO and SerpApi scrape this exact HTML/JSON payload from consumer Google Maps servers.

---

## 4. EXACT QUERY HANDLING

### Strict Query Preservation Rules
1. **Zero String Modification**: The system must never strip keywords or append locality tokens automatically.
   - User input: `"Best pediatrician in Delhi"` $\to$ Query submitted: `"Best pediatrician in Delhi"`.
   - User input: `"Best Hernia Surgeon in Delhi in South Delhi"` $\to$ Query submitted: `"Best Hernia Surgeon in Delhi in South Delhi"`.
2. **Decommissioning `extractBaseSearchIntent`**: The regex logic in [`src/app/api/local-seo/competitors/route.ts#L14-L48`](file:///d:/gyrex/src/app/api/local-seo/competitors/route.ts#L14-L48) that aggressively deleted city names and Delhi localities must be completely deprecated.

---

## 5. GEOGRAPHIC MARKET HANDLING

### Handling Location-Free Keywords
- Keywords like `"Best pediatrician"` or `"Hair transplant clinic"` do not specify a location.
- **Strict Prohibition**: The system must **never** silently guess or append the clinic's locality to the keyword.
- **Resolution**:
  - The keyword string sent to the ranking provider remains unchanged: `"Best pediatrician"`.
  - The **geographic search context** is provided via explicit location parameters (`locationBias` in Places API, or `location_name` / `location_coordinate` in DataForSEO).
  - For location-free keywords, the clinic owner explicitly selects their target market (e.g., *"South Delhi"* or *"Greater Noida"*). If unselected, it defaults to the verified city/district from their Google Business Profile, with an explicit badge in the UI: *"Market: South Delhi (from Clinic Profile)"*.

---

## 6. PLACE ID AND CLINIC MATCHING

### Matching Logic Specification
Located in [`src/lib/audit/google-places.ts#L368-L415`](file:///d:/gyrex/src/lib/audit/google-places.ts#L368-L415):
```ts
// Canonical Primary Matching
const isMatch = userClinic.placeId && result.placeId && userClinic.placeId === result.placeId;
```
- **Place ID Stability**: Google Place IDs can occasionally be updated or aliased by Google (e.g. following a major profile re-verification). To ensure 100% resilience:
  1. Primary match: Compare `result.placeId` against `userClinic.placeId`.
  2. Secondary match: Compare `result.placeId` against historical `locationId` / known Place ID aliases stored in `GbpAccount`.
  3. Tertiary match: Exact normalized string match against `userClinic.name` (only when Place ID is absent).
  4. Clinic Name Change Resilience: Because matching is keyed to Google Place ID, Dr. R. K. Singh editing his clinic name will never break identification or cause his rank to drop to "outside 20".

---

## 7. TOP-20 SEMANTICS & BOUNDARY CONDITIONS

### Strict Definitions
1. **Actual Monitored Range**: The system evaluates positions **#1 through #20**.
2. **Positions #1–#20**: A clinic is assigned rank $N$ ($1 \le N \le 20$) if and only if its verified Place ID appears at index $N-1$ of the verified organic result set.
3. **Absence from Top 20**:
   - If the clinic is not found within the first 20 results, its status is strictly:
     `{ isMonitoredTop20: false, rank: null, status: "OUTSIDE_TOP_20" }`.
   - **STRICT PROHIBITION**: The system must **NEVER** fabricate a rank of `21`, `>20`, or any invented integer. Assigning `rank: 21` when only 20 results were observed is false reporting.
4. **Pagination**: A single page of 20 results satisfies the monitored top-20 requirement. Fetching beyond 20 results increases latency and cost without improving local decision-making.

---

## 8. DATA STORAGE & CONSUMER COMPATIBILITY REVIEW

### Forensic Inspection of Consumers
Every existing consumer of snapshots was inspected to evaluate compatibility:

#### 1. `src/services/local-seo-opportunity.service.ts` (FROZEN)
- Lines 613–640:
  ```ts
  snapshot = await prisma.competitorSnapshot.findFirst({
    where: { gbpAccountId: context.gbpAccountId },
    orderBy: { date: "desc" },
  });
  ...
  let items: any[] = [];
  if (Array.isArray(rawData)) {
    items = rawData;
  } else if (rawData && typeof rawData === "object") {
    if (Array.isArray(rawData.competitors)) {
      items = rawData.competitors;
    } else if (Array.isArray(rawData.data)) {
      items = rawData.data;
    }
  }
  ```
- **Finding**: Can accept either an `Array` or an Object with `.competitors` or `.data`. It looks for `item.isYou === true` and computes `reviewGap = compReviewCount - clinicReviewCount`.

#### 2. `src/app/api/local-seo/recommendations/route.ts` (CRITICAL BREAKAGE RISK IDENTIFIED)
- Lines 35–42:
  ```ts
  const competitorSnap = await prisma.competitorSnapshot.findFirst({
    where: { gbpAccountId: account.id },
    orderBy: { date: 'desc' }
  });
  const competitors = (competitorSnap?.json as any[]) || [];
  ...
  const topCompetitor = competitors.filter(c => !c.isYou)...
  ```
- **CRITICAL DISCOVERY**: Line 42 performs a raw typecast to `any[]` and calls `.filter()` directly on `competitors`.
- **Breakage Verdict**: If `CompetitorSnapshot.json` is saved as an Object (e.g. `{ version: 2, type: "NEAR_ME", ... }`), `(competitorSnap?.json as any[])` is an Object, NOT an Array. Calling `.filter()` will throw:
  `TypeError: competitors.filter is not a function`
  **This would crash the `/api/local-seo/recommendations` route with a 500 error!**

#### 3. Storage Compatibility Decision
To maintain 100% backward compatibility and prevent any breakage:
1. **`CompetitorSnapshot` MUST remain exclusively dedicated to Near Me Competitors** as a **direct JSON array** (`PlaceResult[]`).
   - This prevents any crash in `recommendations/route.ts`.
   - This ensures `COMPETITOR_REVIEW_GAP` in `local-seo-opportunity.service.ts` always evaluates the true 5 km competitor pool.
2. **Keyword Ranking Snapshots MUST NOT overwrite `CompetitorSnapshot`**.
   - If keyword ranking data were saved into `CompetitorSnapshot`, its `orderBy: { date: 'desc' }` would hijack the latest snapshot and corrupt the Opportunity Engine's review gap calculation.
3. **Keyword Ranking Storage Strategy**:
   - For Phase 1 (No Migrations): Keyword ranking snapshots can be stored with a dedicated namespace key in a non-conflicting model, or delivered live with 24-hour in-memory/KV caching.
   - For Long-Term: Introduce an explicit, clean `KeywordRankingSnapshot` model when the architectural review permits schema additions outside `SeoRecommendation`.

---

## 9. COST ESTIMATES & VERIFIED SOURCES (AS OF NOVEMBER 2026)

| Provider / SKU | Unit Price | Monthly Estimate (100 Clinics × 5 Keywords, Weekly) | Source & Verification Date |
| :--- | :--- | :--- | :--- |
| **Google Places API (New: `searchNearby`)** *(Near Me)* | \$32.00 / 1,000 | 100 clinics × 4 syncs/mo = 400 calls $\approx$ **\$12.80 / mo** | Google Maps Platform Pricing Sheet (Nov 2026) |
| **Google Places API (New: `searchText`)** *(Keyword Ranking)* | \$35.00 / 1,000 | 100 clinics × 5 kw × 4 scans = 2,000 calls $\approx$ **\$70.00 / mo** | Google Maps Platform Pricing Sheet (Nov 2026) |
| **Existing Gyrex GeoGrid (`unifiedGeoGrid`)** | \$0.80 / scan (25 calls) | 100 clinics × 5 kw × 4 scans = 2,000 scans $\approx$ **\$1,600.00 / mo** | Direct code audit (25 Classic calls @ \$0.032) |
| **DataForSEO (Google Maps SERP API)** | \$0.002 / search | 2,000 searches $\approx$ **\$4.00 / mo** | DataForSEO Pricing Documentation (Nov 2026) |
| **ValueSERP** | \$0.0025 / search | 2,000 searches $\approx$ **\$5.00 / mo** | ValueSERP Public Pricing (Nov 2026) |

---

## 10. API INTEGRATION DESIGN

### Decoupled Endpoints

#### Endpoint 1: Near Me Competitors
- **Path**: `GET /api/local-seo/competitors/nearby`
- **Engine**: `GooglePlacesProvider.searchNearbyCompetitors`
- **Parameters**: Clinic GBP Latitude/Longitude, Category.
- **Constraints**: 5 km radius strict, 0% keyword dependency, no browser/IP location.
- **Response Shape**:
  ```json
  {
    "success": true,
    "scope": "NEAR_ME_5KM",
    "clinicCoordinates": { "lat": 28.5244, "lng": 77.1855 },
    "radiusMeters": 5000,
    "totalFound": 18,
    "competitors": [
      {
        "placeId": "ChIJ...",
        "name": "Apollo Clinic Saket",
        "distanceMeters": 1420,
        "rating": 4.6,
        "reviewCount": 380,
        "address": "Saket, New Delhi",
        "phone": "+91...",
        "website": "https://..."
      }
    ]
  }
  ```

#### Endpoint 2: Keyword Ranking Report
- **Path**: `GET /api/local-seo/competitors/ranking`
- **Parameters**: `keyword` (verbatim string), `market` (optional explicit market name).
- **Constraints**: Exact query preservation, top 20 evaluation, Place ID clinic matching.
- **Response Shape**:
  ```json
  {
    "success": true,
    "keyword": "Best pediatrician in South Delhi",
    "searchMarket": "South Delhi, Delhi",
    "clinicPlaceId": "ChIJ...",
    "clinicRank": 4,
    "isMonitoredTop20": true,
    "totalMonitored": 20,
    "lastRefreshed": "2026-11-09T18:00:00Z",
    "rankings": [
      {
        "rank": 1,
        "placeId": "ChIJ...",
        "name": "Rainbow Children's Hospital",
        "rating": 4.8,
        "reviewCount": 1250,
        "isClinic": false
      },
      {
        "rank": 4,
        "placeId": "ChIJ...",
        "name": "Dr. R. K. Singh Clinic",
        "rating": 4.9,
        "reviewCount": 210,
        "isClinic": true
      }
    ]
  }
  ```

---

## 11. RISKS AND DEPENDENCIES

1. **Risk of Crashed Recommendations Route**: Saving non-array payloads to `CompetitorSnapshot` will immediately crash `src/app/api/local-seo/recommendations/route.ts#L42`.
   - *Mitigation*: Strictly keep `CompetitorSnapshot` as an array of 5 km nearby competitors.
2. **Places API vs Maps SERP Discrepancy**: If users compare Places API results with the Google Maps consumer app, minor rank order differences may occur.
   - *Mitigation*: Clear UI labeling ("Monitored Google Places Benchmark") and an external "Verify on Google Maps" link. Long-term upgrade to DataForSEO solves this completely.
3. **GeoGrid Integrity**: `SearchGridSnapshot` must not be touched or repurposed to prevent breaking `STRIKING_DISTANCE` in `local-seo-opportunity.service.ts`.

---

## 12. FINAL IMPLEMENTATION RECOMMENDATION

We recommend approving the following sequence for Phase 1:

1. **Retain `CompetitorSnapshot` as pure array of 5 km Nearby Competitors** generated via `GooglePlacesProvider.searchNearbyCompetitors`. This preserves zero breakage for the Opportunity Engine and Recommendations API.
2. **Build the dedicated `KeywordRankingService`** querying Google Places Text Search with exact keyword preservation, explicit market location bias, and verified Place ID matching.
3. **Decompose the UI in `CompetitorInsights.tsx`** by removing the `Entire City / Near Clinic` toggle and mounting two independent panels:
   - Panel 1: **Near Me Competitors (5 km Radius)**
   - Panel 2: **Keyword Ranking Report (Top 20 Leaderboard)**
4. **Prepare an abstraction layer** in `KeywordRankingService` so that Gyrex can seamlessly swap the underlying provider from Google Places Text Search to **DataForSEO** in Phase 2 with zero frontend changes.
