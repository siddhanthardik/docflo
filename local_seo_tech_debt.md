# Local SEO Module - Production Readiness Audit

This audit evaluates the current implementation against the strict "GBP Operating System" criteria. While the initial refactoring successfully removed `Math.random()` and the hardcoded AI generation, the underlying data layer still contains significant technical debt that must be resolved before proceeding to new features.

## Technical Debt & Gap Analysis

### 1. Data Integrity & Nullability
**Criteria:** No missing Google field is silently converted to 0; use null/unknown with explicit scan status instead.
**Status:** 🔴 **FAILED**
- **Issue:** In `src/lib/seo-engine/fetcher.ts`, missing fields are explicitly coerced to `0` (e.g., `typeof rawData.totalReviews === 'number' ? rawData.totalReviews : 0`). 
- **Issue:** The Prisma `GbpSnapshot` schema incorrectly enforces `@default(0)` for `reviewCount`, `averageRating`, `photoCount`, and `postCount`.
- **Debt:** Must refactor schema to use optional `Int?`/`Float?` and update the fetcher to assign `null` when a Google field is omitted.

### 2. Scan Metadata & API Failure Handling
**Criteria:** Snapshots include scan metadata (success/failure, timestamps, API status, partial failures) and handle quota limits without corrupting history.
**Status:** 🔴 **FAILED**
- **Issue:** `GbpSnapshot` currently lacks fields for `scanStatus`, `apiErrors`, and `partialFailure`.
- **Issue:** `fetcher.ts` has no robust try/catch blocks or partial failure tracking. If one Google endpoint fails (e.g., `locations.reviews`), the entire snapshot is either aborted or silently saves `0` for reviews.
- **Debt:** Add `scanStatus (enum)`, `errorLogs (JSON)`, and `quotaExceeded (Boolean)` to the snapshot schema. Ensure the fetcher gracefully degrades.

### 3. Rule Traceability
**Criteria:** Every rule documents its exact Google API source and field.
**Status:** 🔴 **FAILED**
- **Issue:** Rules in `src/lib/seo-engine/ruleset.ts` do not reference Google API sources. 
- **Debt:** Each rule must be annotated (via JSDoc or within the rule definition) specifying the exact endpoint (e.g., `GET /v1/locations/{locationId}/reviews`) and JSON path it relies on.

### 4. Task Aggregation
**Criteria:** Duplicate recommendations are merged into a single task with aggregated evidence.
**Status:** 🔴 **FAILED**
- **Issue:** `engine.ts` currently pushes raw tasks straight to the database. If multiple rules trigger similar tasks (e.g., multiple content-related observations), they are not grouped.
- **Debt:** Implement an aggregator/reducer layer in `engine.ts` that groups related observations (e.g., "Content & Posting") into unified `SeoTask` records with aggregated evidence.

### 5. Competitor Intelligence
**Criteria:** Competitor data is sourced only from real Google APIs and cached correctly.
**Status:** 🟡 **PARTIAL**
- **Issue:** The `CompetitorSnapshot` schema exists, and the UI correctly defaults to "Pending scan". However, the actual data fetching logic for competitors (via Google Places API / Text Search API) is completely unwritten.
- **Debt:** Build the Google Places API fetcher for competitors to populate `CompetitorSnapshot`.

### 6. Historical Rendering
**Criteria:** Weekly history is both stored and rendered in the dashboard where appropriate.
**Status:** 🟡 **PARTIAL**
- **Issue:** We are now storing snapshots, but `page.tsx` does not query or render historical trends (e.g., "Review Velocity" or "Rank Changes").
- **Debt:** Update `/api/gbp/tasks` or `/api/gbp/local-seo` to return a 4-week historical trend array, and map it to the UI (e.g., showing a sparkline or `+2 reviews this week`).

---

## Proposed Next Steps

Before moving to a new module, we must pay down this technical debt. I recommend executing the following remediation plan:

1. **Schema Migration:** Update `schema.prisma` to make metrics nullable (`Int?`) and add `scanStatus` and `apiErrors` to snapshots.
2. **Fetcher Refactor:** Rewrite `fetcher.ts` to implement strict null-checks and partial failure handling.
3. **Ruleset Update:** Add API traceability to all rules in `ruleset.ts` and build an aggregation layer in `engine.ts`.
4. **Competitor Fetcher:** Implement the Google Places integration to populate `CompetitorSnapshot`.
5. **Dashboard Wiring:** Wire up the historical data to the frontend matrix.

Please approve this audit so we can begin the remediation phase.
