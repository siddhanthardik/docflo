# DocFlo Local SEO Module: Product & Architecture Review

## 1. Information Currently Collected from GBP
Based on the `prisma/schema.prisma` and the codebase (`insightsData` JSON blob and `AuditReport`), the following fields are currently collected:
*   OAuth Tokens (Access/Refresh/Expiry)
*   Location ID & Location Name
*   Categories (Primary and Secondary)
*   Business Description
*   Total Review Count & Average Rating
*   City
*   Recent Reviews array (with boolean `replied` status)
*   *(In Free Audit)*: Website URL, Business Name, Address, Speciality, Business Type.

## 2. Information NOT Collected (But Should Be)
To provide a ₹50,000 consultant-level experience, the following critical data points are missing:
*   **Media & Photos:** Cover photo presence, interior/exterior photo counts, upload velocity (owner vs. user).
*   **Post History:** Historical post content, exact publish dates, and engagement metrics (views/clicks). *(Note: The `GBPPost` table only tracks posts created through DocFlo, not historical native posts).*
*   **Business Attributes:** Health/safety attributes, accessibility, amenities, insurance accepted (critical for healthcare).
*   **Booking Links:** Presence and correctness of the Appointment URL.
*   **Products / Services:** List of services offered, descriptions, and pricing.
*   **Q&A:** Questions asked by users and whether the owner has responded.
*   **Review Content:** The actual text of owner replies (to check for SEO keyword density in replies, not just a true/false `replied` boolean).
*   **Business Hours:** Special hours, holiday hours accuracy.
*   **Messaging Status:** Is Google Chat turned on for the profile?

## 3. Current Recommendations Shown
The `Action Plan` tab (`generateActionPlan` function) generates these specific tasks:
1.  **"Optimize Your GBP Description"**
2.  **"Increase Review Velocity"**
3.  **"Reply to Pending Reviews"**
4.  **"Publish a Weekly Update"**
5.  **"You are dominating!"** (Fallback state)

## 4. Duplicated Recommendations
While the dashboard UI doesn't spawn duplicate tasks concurrently, there is an architectural duplication. The **Free Audit Module** generates physical `AuditRecommendation` records in the database, while the **Paid Dashboard** generates its own separate tasks on-the-fly in the frontend (`page.tsx`) without saving them to the database.

## 5. Generic Recommendations
*   **"Increase Review Velocity"**: The description states, *"Top competitors typically get 5-10 reviews a month."* This is a hardcoded, generic assumption rather than an analysis of the clinic's actual local competitors.
*   **"Publish a Weekly Update"**: States, *"Fresh content signals to Google..."* This is a generic best practice, not tied to a specific keyword gap or a competitor's aggressive posting strategy.

## 6. Transforming into Evidence-Based Recommendations
*   **Review Velocity:** Instead of a generic target, analyze tracked competitors. *Recommendation: "Your main competitor (City Med) gained 12 reviews this month. You gained 3. Send 15 WhatsApp review requests this week to close the gap."*
*   **Description Optimization:** Instead of a generic keyword check, reference the exact grid data. *Recommendation: "You rank #14 for 'Infertility Specialist'. Add this exact phrase to the first paragraph of your GBP description."*
*   **Content Freshness:** Fetch actual GBP post history. *Recommendation: "You haven't posted an update in 41 days. Clinics posting weekly see a 14% lift in map pack visibility. Generate an AI post now."*

## 7. Action Plan Page: Real vs. Placeholder Data
The Action Plan is currently heavily reliant on **placeholders**:
*   **Placeholder 1 (Content Freshness):** `const daysSinceLastPost = 14; // Mocked`. The system does not actually know when the doctor last posted.
*   **Placeholder 2 (Keyword Volume):** Seed keywords are generated with `Math.floor(Math.random() * 500) + 150`.
*   **Placeholder 3 (Keyword Difficulty & Rank):** All ranking data used to trigger relevance tasks is randomly generated on the server.

## 8. Competitor Intelligence Review
**Currently Compared:**
*   Total Reviews, Average Rating, Review Velocity (per month), Primary Category Match.
*(Note: These are currently generated using static multipliers like `Math.floor(totalReviews * (1 + (i * 0.4)))` rather than fetching real Google Places data for the competitors).*

**Important Missing Metrics:**
*   Share of Voice / Map Pack Presence % across a grid.
*   Content Velocity (How often do they post?).
*   Profile Completeness Score (Do they have Appointment URLs while we don't?).
*   Photo Count comparisons.
*   Q&A Response Rate.

## 9. Local Geo Grid Production Readiness
**Status:** **NOT Ready for Production.**
The Geo Grid is currently a UI mockup. It lacks:
1.  **Real Geolocation Data:** No latitude/longitude coordinates for the nodes.
2.  **Rank Tracking API Integration:** A 3rd-party API (like DataForSEO) is required to perform localized grid searches.
3.  **Interactivity:** Clicking a keyword in the table does not update the map numbers (the numbers `12, 6, 14, 1...` are hardcoded JSX).

## 10. Database Design Review
**Do we have enough tables? No.**
To support a SaaS recurring model without redesigning everything, we lack historical tracking:
*   `insightsData` inside `GbpAccount` is a single JSON blob that gets overwritten. There is no `GbpSnapshot` table to store week-over-week history.
*   There is no `SeoTask` table for the paid dashboard to persist generated tasks, track when a user completed them, or schedule them. (The existing `AuditRecommendation` is tied only to the one-off Free Audit report).

## 11. Scan Engine Review
**Can it detect changes between scans? No.**
The API route (`api/gbp/local-seo/route.ts`) only reads and overwrites the current JSON state.
**Minimal Additions Required:**
1.  Create a `GbpSnapshot` table linked to `GbpAccount` with a `createdAt` timestamp.
2.  Build a background cron job that fetches data from the Google API weekly and inserts a *new* row.
3.  Write a diffing utility that compares `Snapshot(Current)` with `Snapshot(T-7 days)`.

## 12. UI Review (Without Redesign)
*   **Confusing UX (Competitor Tracking):** The user enters a string (e.g., "City Med") into the Competitor input, and it instantly appears in the table with data. Users will realize the data is fake because the system didn't ask them to confirm a specific Google Maps Place ID.
*   **Disconnected Data:** The "Your Rank" column in the table does not match the central node rank on the Geo Grid map above it.
*   **Contradictory Info:** The Action Plan might say "Increase Review Velocity" while the Competitor tab randomly generates mocked competitor data that shows the user is actually winning on velocity.

## 13. Navigation Review
The tabs (`Action Plan`, `Geo Grid`, `Competitors`) are logically sound and represent the core pillars.
*   **Recommendation:** Keep them, but consider making `Competitors` a sub-section of `Geo Grid`. Competitors are geographically bound; you discover them *via* the grid. The Action Plan should remain the default landing view.

## 14. The "Monday Morning Doctor" Test
If a doctor logs in every Monday:
*   **What changed?** *Unanswered.* There are no trend lines, arrows, or historical comparisons.
*   **What should I do?** *Partially answered.* The Action plan provides tasks, but because they are generic and static, the doctor will develop "banner blindness" by week three.
*   **What should I ignore?** *Unanswered.* The system does not triage well; a missing description keyword is given the same weight as losing the #1 spot in the map pack.
*   **Am I improving?** *Unanswered.* The health score is calculated on the fly without a historical graph showing the score moving from 60 to 85 over the month.

## 15. Prioritized Roadmap
**Phase 2: Data & Infrastructure Foundation**
*   Create `GbpSnapshot` and `SeoTask` Prisma models.
*   Integrate a real localized rank tracking API (e.g., DataForSEO or ValueSerp) for the Geo Grid.
*   Implement Google Places API lookup for competitor tracking (so users select a real Place ID, not just type a string).

**Phase 3: The Diffing Engine**
*   Implement the background cron job to snapshot GBP and Grid data weekly.
*   Build the diffing engine to calculate week-over-week changes (e.g., `New Reviews = Snapshot[Current].reviews - Snapshot[Past].reviews`).
*   Rewrite `generateActionPlan` to run on the backend, generating persistent, evidence-based `SeoTask` records based on the diffs.

**Phase 4: Reporting & UX Verification**
*   Wire the dashboard UI to read from the historical snapshot tables.
*   Add trend graphs (sparklines) for the Health Score and Review Velocity.
*   Make the Geo-Grid interactive (clicking a keyword updates the grid nodes).
*   Implement weekly automated email digests summarizing the diffs.
