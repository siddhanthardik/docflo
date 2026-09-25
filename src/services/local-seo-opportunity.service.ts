import { prisma } from "@/lib/prisma";
import type { SeoRecommendation } from "@prisma/client";
import {
  OpportunityCategory,
  OpportunityPriority,
  OpportunityActionType,
  OpportunityAction,
  OpportunityEvidence,
  StructuredOpportunityPayload,
  OpportunityPayloadVersion,
  parseRecommendationDescription,
} from "@/types/local-seo-opportunity";

// Re-export shared contract types so existing consumers remain 100% compatible
export type {
  OpportunityCategory,
  OpportunityPriority,
  OpportunityActionType,
  OpportunityAction,
  OpportunityEvidence,
  StructuredOpportunityPayload,
  OpportunityPayloadVersion,
};

export interface EvaluatedOpportunity {
  category: OpportunityCategory;
  type: string;                      // e.g. "STRIKING_DISTANCE", "COLD_ZONE", "REVIEW_GAP", "STALE_POST"
  entityKey: string;                 // Deterministic identifier (e.g. keyword, competitorId, "clinic")
  title: string;
  summary: string;
  evidence: OpportunityEvidence;
  opportunity: string;               // Plain-language observation and growth hypothesis
  suggestedActions: OpportunityAction[];
  priority: OpportunityPriority;
  impact?: string;
  metadata?: Record<string, any>;
}

export interface HydratedOpportunity extends Omit<SeoRecommendation, "description"> {
  rawDescription: string;
  payload: StructuredOpportunityPayload;
}

export interface OpportunityEvaluationContext {
  doctorId: string;
  gbpAccountId: string;
  doctorSpecialty?: string | null;
  clinicCity?: string | null;
  /**
   * Important data source distinction:
   * - keywordSnapshot contains Google Performance API search queries and impression counts (NO rank positions).
   * - searchGridSnapshot contains actual 5x5 geo-spatial ranking positions.
   * - competitorSnapshot contains competitor names, ratings, review counts, and distances.
   */
  keywordSnapshot?: any;
  searchGridSnapshot?: any;
  competitorSnapshot?: any;
  postSnapshot?: any;
  doctorReviews?: any[];
}

export interface ReconciliationOptions {
  /**
   * If true, PENDING version:1 opportunities that are no longer produced
   * (e.g. underlying evidence condition resolved) are transitioned to EXPIRED.
   * Default: true.
   */
  expireUnmatchedPending?: boolean;
  /**
   * Days to suppress dismissed opportunities before considering them eligible for recreation.
   * Default: 30 days.
   */
  dismissalSuppressionDays?: number;
}

export interface ReconciliationResult {
  createdCount: number;
  updatedCount: number;
  preservedCompletedCount: number;
  suppressedDismissedCount: number;
  expiredCount: number;
  allRecommendations: SeoRecommendation[];
  activeOpportunities: HydratedOpportunity[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONSTANTS & CAPS
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_ACTIVE_OPPORTUNITIES = 6;
export const MAX_CATEGORY_OPPORTUNITIES = 2;

export interface UsableGridCell {
  row: number;
  col: number;
  rank: number;
  found: boolean;
  lat?: number;
  lng?: number;
}

/**
 * Extracts and validates usable grid cells from a SearchGridSnapshot record or raw object.
 * Discards malformed or non-numeric entries so that missing/unusable cells are never treated
 * as false failures or inflated metrics.
 */
export function extractUsableGridCells(snapshot: any): UsableGridCell[] {
  if (!snapshot) return [];

  let rawCells: any = snapshot.json ?? snapshot.gridCells ?? snapshot.cells;
  if (typeof rawCells === "string") {
    try {
      rawCells = JSON.parse(rawCells);
    } catch {
      return [];
    }
  }

  if (rawCells && typeof rawCells === "object" && !Array.isArray(rawCells)) {
    if (Array.isArray(rawCells.cells)) {
      rawCells = rawCells.cells;
    } else if (Array.isArray(rawCells.grid)) {
      rawCells = rawCells.grid;
    }
  }

  if (!Array.isArray(rawCells)) return [];

  const usable: UsableGridCell[] = [];
  for (const cell of rawCells) {
    if (!cell || typeof cell !== "object") continue;

    const row = typeof cell.row === "number" ? cell.row : parseInt(cell.row, 10);
    const col = typeof cell.col === "number" ? cell.col : parseInt(cell.col, 10);
    const rank = typeof cell.rank === "number" ? cell.rank : parseInt(cell.rank, 10);

    if (isNaN(row) || isNaN(col) || isNaN(rank) || row < 0 || col < 0 || rank < 0) {
      continue;
    }

    const found = typeof cell.found === "boolean" ? cell.found : rank > 0 && rank <= 20;

    usable.push({
      row,
      col,
      rank,
      found,
      lat: typeof cell.lat === "number" ? cell.lat : undefined,
      lng: typeof cell.lng === "number" ? cell.lng : undefined,
    });
  }

  return usable;
}

/**
 * Cross-references search query impression counts from a GbpKeywordSnapshot without ever
 * inferring or fabricating rank positions. Returns the observed impression count or null if not reported.
 */
export function findObservedImpressions(snapshot: any, targetKeyword: string): number | null {
  if (!snapshot || !targetKeyword) return null;

  const normalizedTarget = targetKeyword.trim().toLowerCase();
  let rawData: any = snapshot.json ?? snapshot;

  if (typeof rawData === "string") {
    try {
      rawData = JSON.parse(rawData);
    } catch {
      return null;
    }
  }

  // Handle standard Google Performance API schema: { searchKeywordsCounts: [...] }
  let items: any[] = [];
  if (Array.isArray(rawData)) {
    items = rawData;
  } else if (rawData && typeof rawData === "object") {
    if (Array.isArray(rawData.searchKeywordsCounts)) {
      items = rawData.searchKeywordsCounts;
    } else if (Array.isArray(rawData.searchKeywords)) {
      items = rawData.searchKeywords;
    } else if (Array.isArray(rawData.keywords)) {
      items = rawData.keywords;
    }
  }

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const term = (item.searchKeyword || item.query || item.keyword || "").toString().trim().toLowerCase();
    if (term === normalizedTarget) {
      const rawVal =
        item.insightsValue?.value ??
        item.insightsValue?.threshold ??
        item.impressions ??
        item.value;

      if (rawVal !== undefined && rawVal !== null) {
        const parsed = typeof rawVal === "number" ? rawVal : parseInt(String(rawVal), 10);
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SERVICE ORCHESTRATION LAYER
// ─────────────────────────────────────────────────────────────────────────────

export class LocalSeoOpportunityService {
  /**
   * Constructs a deterministic deduplication key for an opportunity.
   * Example: "RANKING:STRIKING_DISTANCE:pediatrician near me"
   */
  static constructDeduplicationKey(category: OpportunityCategory, type: string, entityKey: string): string {
    return `${category}:${type.toUpperCase()}:${entityKey.trim().toLowerCase()}`;
  }

  /**
   * Encodes an EvaluatedOpportunity into a backward-compatible JSON string
   * stored within SeoRecommendation.description.
   */
  static encodePayload(opportunity: EvaluatedOpportunity): string {
    const payload: StructuredOpportunityPayload = {
      version: 1,
      type: opportunity.type,
      entityKey: opportunity.entityKey,
      summary: opportunity.summary,
      evidence: opportunity.evidence,
      opportunity: opportunity.opportunity,
      suggestedActions: opportunity.suggestedActions,
      metadata: {
        ...opportunity.metadata,
        dedupKey: this.constructDeduplicationKey(opportunity.category, opportunity.type, opportunity.entityKey),
      },
    };
    return JSON.stringify(payload);
  }

  /**
   * Decodes a SeoRecommendation.description into a StructuredOpportunityPayload.
   * If the record contains legacy plain text, it synthesizes a graceful fallback payload.
   */
  static decodePayload(rawDescription: string, fallbackTitle: string = "Recommended Action", category: string = "PROFILE"): StructuredOpportunityPayload {
    if (!rawDescription) {
      return {
        version: 1,
        type: "LEGACY",
        entityKey: "default",
        summary: fallbackTitle,
        evidence: {
          metric: "Profile Observation",
          observedValue: "Detected",
          context: fallbackTitle,
          source: "Google Profile Insights",
        },
        opportunity: fallbackTitle,
        suggestedActions: [],
      };
    }

    const parsedResult = parseRecommendationDescription(rawDescription);
    if (parsedResult.kind === "structured") {
      return parsedResult.payload;
    }

    // Graceful backward-compatible fallback for plain text records
    return {
      version: 1,
      type: "LEGACY_TASK",
      entityKey: fallbackTitle.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      summary: fallbackTitle,
      evidence: {
        metric: "Status Observation",
        observedValue: "Action Recommended",
        context: rawDescription,
        source: "Local SEO Audit",
      },
      opportunity: rawDescription,
      suggestedActions: [
        {
          label: category === "REVIEWS" ? "Open Reviews" : category === "CONTENT" ? "Create Update" : "View Dashboard",
          actionType: category === "REVIEWS" ? "OPEN_REVIEWS" : category === "CONTENT" ? "OPEN_POSTS" : "OPEN_PROFILE_HEALTH",
          route: category === "REVIEWS" ? "/reviews" : category === "CONTENT" ? "/gbp/posts" : "/local-seo",
        }
      ],
    };
  }

  /**
   * Hydrates a Prisma SeoRecommendation record with its decoded structured payload.
   */
  static hydrateRecommendation(rec: SeoRecommendation): HydratedOpportunity {
    return {
      ...rec,
      rawDescription: rec.description,
      payload: this.decodePayload(rec.description, rec.title, rec.category),
    };
  }

  /**
   * Applies the global and category-level caps to evaluated opportunities.
   * Priority order: HIGH -> MEDIUM -> LOW.
   * Enforces:
   * - Max MAX_CATEGORY_OPPORTUNITIES (2) per category
   * - Max MAX_ACTIVE_OPPORTUNITIES (5-6) total
   */
  static applyOpportunityCaps(opportunities: EvaluatedOpportunity[]): EvaluatedOpportunity[] {
    const priorityWeight: Record<OpportunityPriority, number> = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    const sorted = [...opportunities].sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return a.title.localeCompare(b.title);
    });

    const categoryCounts: Record<string, number> = {};
    const capped: EvaluatedOpportunity[] = [];

    for (const opp of sorted) {
      if (capped.length >= MAX_ACTIVE_OPPORTUNITIES) break;

      const currentCount = categoryCounts[opp.category] || 0;
      if (currentCount >= MAX_CATEGORY_OPPORTUNITIES) continue;

      categoryCounts[opp.category] = currentCount + 1;
      capped.push(opp);
    }

    return capped;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. CATEGORY EVALUATORS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Phase 3A Evaluator: Ranking / Striking Distance
   * Uses actual SearchGridSnapshot rank evidence (NOT inferred from GbpKeywordSnapshot).
   * GbpKeywordSnapshot is joined strictly to extract observed search query impression counts.
   *
   * Threshold: STRIKING_DISTANCE = observed rank #4–#8 (proposed V1 opportunity threshold
   * for identifying observed upper-grid visibility outside positions #1–#3).
   * Priority: HIGH if rank <= 5 with >= 30 observed monthly impressions; otherwise MEDIUM.
   */
  static async evaluateRankingOpportunities(context: OpportunityEvaluationContext): Promise<EvaluatedOpportunity[]> {
    let gridSnapshots: any[] = [];
    if (Array.isArray(context.searchGridSnapshot)) {
      gridSnapshots = context.searchGridSnapshot;
    } else if (context.searchGridSnapshot) {
      gridSnapshots = [context.searchGridSnapshot];
    } else if (context.gbpAccountId) {
      gridSnapshots = await prisma.searchGridSnapshot.findMany({
        where: { gbpAccountId: context.gbpAccountId },
        orderBy: { date: "desc" },
        take: 5,
      });
    }

    if (gridSnapshots.length === 0) return [];

    let kwSnapshot = context.keywordSnapshot;
    if (!kwSnapshot && context.gbpAccountId) {
      kwSnapshot = await prisma.gbpKeywordSnapshot.findFirst({
        where: { gbpAccountId: context.gbpAccountId },
        orderBy: { date: "desc" },
      });
    }

    const opportunities: EvaluatedOpportunity[] = [];
    const seenKeywords = new Set<string>();

    for (const snapshot of gridSnapshots) {
      const rawKeyword = (snapshot.keyword || "").trim();
      if (!rawKeyword) continue;
      const normalizedKeyword = rawKeyword.toLowerCase();
      if (seenKeywords.has(normalizedKeyword)) continue;

      const usableCells = extractUsableGridCells(snapshot);
      if (usableCells.length === 0) continue;

      const gridSize = snapshot.gridSize || 5;
      const centerRow = Math.floor(gridSize / 2);
      const centerCol = Math.floor(gridSize / 2);
      const centerCell = usableCells.find((c) => c.row === centerRow && c.col === centerCol);

      // Use actual center/clinic grid cell for center rank when available.
      // Do NOT calculate a mathematical average of multiple grid-cell ranks and label it as center rank.
      // If no actual center rank exists, do not manufacture one.
      const centerRank =
        centerCell && centerCell.found && typeof centerCell.rank === "number" && centerCell.rank > 0
          ? centerCell.rank
          : null;

      if (centerRank === null) continue;

      // STRIKING_DISTANCE criteria: Observed center rank between #4 and #8
      if (centerRank < 4 || centerRank > 8) continue;

      seenKeywords.add(normalizedKeyword);

      const observedRank = centerRank;

      // Cross-reference observed monthly search impressions from GbpKeywordSnapshot without inventing
      const impressions = findObservedImpressions(kwSnapshot, rawKeyword);

      // Deterministic priority: Rank #4-#5 with observed >=30 impressions is HIGH; otherwise MEDIUM
      const isHighPriority = observedRank <= 5 && impressions !== null && impressions >= 30;
      const priority: OpportunityPriority = isHighPriority ? "HIGH" : "MEDIUM";

      const suggestedActions: OpportunityAction[] = [
        {
          label: "View in Rank Tracker",
          actionType: "OPEN_RANK_TRACKER",
          route: `/local-seo?tab=rank-tracker&keyword=${encodeURIComponent(rawKeyword)}`,
        },
      ];

      // Only include OPEN_POSTS when additional evidence in the evaluator explicitly supports a content-related action
      if (
        context.postSnapshot &&
        (context.postSnapshot.requiresUpdate === true ||
          context.postSnapshot.hasStalePosts === true ||
          (Array.isArray(context.postSnapshot) && context.postSnapshot.length === 0))
      ) {
        suggestedActions.push({
          label: "Draft Targeted Update",
          actionType: "OPEN_POSTS",
          route: `/gbp/posts?draftKeyword=${encodeURIComponent(rawKeyword)}`,
          payload: { keyword: rawKeyword },
        });
      }

      const impressionNote =
        impressions !== null
          ? ` with ${impressions} observed monthly search impressions`
          : " (search impressions not reported in current Google performance period)";

      opportunities.push({
        category: "RANKING",
        type: "STRIKING_DISTANCE",
        entityKey: `keyword:${normalizedKeyword}`,
        title: `Evaluate striking-distance keyword '${rawKeyword}'`,
        summary: `Observed at center rank #${observedRank} in latest search grid.`,
        evidence: {
          metric: "Observed Grid Rank Position",
          observedValue: `#${observedRank}`,
          benchmark: "Positions #1–#3",
          context: `Keyword '${rawKeyword}' was observed at center rank #${observedRank} in the latest ${gridSize}x${gridSize} search grid scan${impressionNote}.`,
          source: impressions !== null ? "SearchGridSnapshot + GbpKeywordSnapshot" : "SearchGridSnapshot",
        },
        opportunity: `Keyword '${rawKeyword}' was observed at center rank #${observedRank} (positions #4–#8) in the latest grid scan and may warrant review in Rank Tracker.`,
        suggestedActions,
        priority,
        impact: "High-intent search visibility",
        metadata: {
          keyword: rawKeyword,
          centerRank: observedRank,
          observedRank,
          rankType: "center clinic position",
          gridSize,
          observedImpressions: impressions,
          scanDate: snapshot.date || snapshot.createdAt || null,
        },
      });
    }

    return opportunities;
  }

  /**
   * Phase 3B Evaluator: Geographic Visibility Gaps
   * Evaluates SearchGridSnapshot 5x5 spatial cells based strictly on usable cells.
   * Weak cell = not found, rank === 0, or rank > 10.
   *
   * Threshold: WEAK_GEOGRAPHIC_VISIBILITY = >= 40% of usable scanned cells meet the defined weak-cell criteria.
   * Priority: HIGH if center is strong (#1-#3) but >= 60% of perimeter grid is weak;
   *           MEDIUM if center is strong and >= 40% weak;
   *           LOW if overall grid is generally weak.
   */
  static async evaluateSearchGridOpportunities(context: OpportunityEvaluationContext): Promise<EvaluatedOpportunity[]> {
    let gridSnapshots: any[] = [];
    if (Array.isArray(context.searchGridSnapshot)) {
      gridSnapshots = context.searchGridSnapshot;
    } else if (context.searchGridSnapshot) {
      gridSnapshots = [context.searchGridSnapshot];
    } else if (context.gbpAccountId) {
      gridSnapshots = await prisma.searchGridSnapshot.findMany({
        where: { gbpAccountId: context.gbpAccountId },
        orderBy: { date: "desc" },
        take: 5,
      });
    }

    if (gridSnapshots.length === 0) return [];

    const opportunities: EvaluatedOpportunity[] = [];
    const seenGrids = new Set<string>();

    for (const snapshot of gridSnapshots) {
      const rawKeyword = (snapshot.keyword || "").trim() || "Local Area";
      const normalizedKeyword = rawKeyword.toLowerCase();
      if (seenGrids.has(normalizedKeyword)) continue;

      const usableCells = extractUsableGridCells(snapshot);
      if (usableCells.length === 0) continue;

      // Weak cell = not found, rank === 0, or rank > 10
      const weakCells = usableCells.filter((c) => !c.found || c.rank === 0 || c.rank > 10);
      const weakCellRatio = weakCells.length / usableCells.length;
      const weakPct = Math.round(weakCellRatio * 100);

      // Threshold: weak-cell ratio >= 40% of usable cells
      if (weakCellRatio < 0.40) continue;

      seenGrids.add(normalizedKeyword);

      const gridSize = snapshot.gridSize || 5;
      const centerRow = Math.floor(gridSize / 2);
      const centerCol = Math.floor(gridSize / 2);
      const centerCell = usableCells.find((c) => c.row === centerRow && c.col === centerCol);
      const centerRank =
        centerCell && centerCell.found && typeof centerCell.rank === "number" && centerCell.rank > 0
          ? centerCell.rank
          : null;
      const centerStrong = centerRank !== null && centerRank <= 3;

      // Deterministic priority based on evidence:
      // HIGH: center is strong (#1-#3) but >= 60% of perimeter grid is weak (sharp geographic drop-off)
      // MEDIUM: center is strong (#1-#3) and >= 40% weak
      // LOW: general weak visibility across the scanned grid (center is weak or unranked)
      let priority: OpportunityPriority = "LOW";
      if (centerStrong) {
        priority = weakCellRatio >= 0.60 ? "HIGH" : "MEDIUM";
      }

      const suggestedActions: OpportunityAction[] = [
        {
          label: "View Search Grid",
          actionType: "OPEN_SEARCH_GRID",
          route: `/local-seo?tab=rank-tracker&view=grid&keyword=${encodeURIComponent(rawKeyword)}`,
        },
      ];

      // Offer competitor comparison if competitor context exists
      if (context.competitorSnapshot) {
        suggestedActions.push({
          label: "Compare Nearby Competitors",
          actionType: "OPEN_COMPETITORS",
          route: "/local-seo?tab=competitors",
        });
      }

      const approxRadiusKm = snapshot.spacingMeters
        ? ((snapshot.spacingMeters * gridSize) / 1000).toFixed(1) + "km"
        : "scanned local";

      opportunities.push({
        category: "SEARCH_GRID",
        type: "WEAK_GEOGRAPHIC_VISIBILITY",
        entityKey: `grid:${normalizedKeyword}`,
        title: `Address geographic visibility drop in perimeter grid (${weakPct}% weak cells)`,
        summary: `${weakCells.length} of ${usableCells.length} grid cells rank >10 or no result.`,
        evidence: {
          metric: "Geographic Weak-Cell Ratio",
          observedValue: `${weakCells.length}/${usableCells.length} cells (${weakPct}%)`,
          benchmark: "< 40% weak cells",
          context: `${weakCells.length} of ${usableCells.length} usable grid cells recorded rank >10 or no result across the ${approxRadiusKm} grid for '${rawKeyword}'.`,
          source: "SearchGridSnapshot",
        },
        opportunity: `${weakPct}% of usable scanned grid coordinates for '${rawKeyword}' meet the weak-cell criteria (rank >10 or no result).`,
        suggestedActions,
        priority,
        impact: "Geographic search prominence",
        metadata: {
          keyword: rawKeyword,
          gridSize,
          usableCellsCount: usableCells.length,
          weakCellsCount: weakCells.length,
          weakCellRatio,
          centerRank,
          centerStrong,
          spacingMeters: snapshot.spacingMeters || null,
          scanDate: snapshot.date || snapshot.createdAt || null,
        },
      });
    }

    return opportunities;
  }

  /**
   * Phase 4A Evaluator: Competitor Intelligence
   * Data consumed: CompetitorSnapshot (names, ratings, review counts, distances).
   *
   * Threshold: COMPETITOR_REVIEW_GAP = competitor review count exceeds clinic's review count by > 20.
   * Priority: HIGH if review gap >= 50; MEDIUM if review gap > 20.
   *
   * Zero causal claims or promises of ranking improvement.
   * Zero historical velocity inferred from a single snapshot.
   */
  static async evaluateCompetitorOpportunities(context: OpportunityEvaluationContext): Promise<EvaluatedOpportunity[]> {
    let snapshot = context.competitorSnapshot;
    if (!snapshot && context.gbpAccountId) {
      snapshot = await prisma.competitorSnapshot.findFirst({
        where: { gbpAccountId: context.gbpAccountId },
        orderBy: { date: "desc" },
      });
    }

    if (!snapshot) return [];

    let rawData: any = snapshot.json ?? snapshot;
    if (typeof rawData === "string") {
      try {
        rawData = JSON.parse(rawData);
      } catch {
        return [];
      }
    }

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

    if (!Array.isArray(items) || items.length === 0) return [];

    // Locate clinic's own review count from the snapshot or context
    let clinicReviewCount: number | null = null;
    const clinicItem = items.find((item) => item && (item.isYou === true || item.id === "you"));
    if (clinicItem) {
      const parsedClinicCount =
        typeof clinicItem.reviewCount === "number"
          ? clinicItem.reviewCount
          : (typeof clinicItem.user_ratings_total === "number" ? clinicItem.user_ratings_total : null);
      if (parsedClinicCount !== null && !isNaN(parsedClinicCount) && parsedClinicCount >= 0) {
        clinicReviewCount = parsedClinicCount;
      }
    }

    // Fallback: If not found in snapshot items, check context.doctorReviews
    if (clinicReviewCount === null && Array.isArray(context.doctorReviews)) {
      clinicReviewCount = context.doctorReviews.length;
    }

    // If clinic review count cannot be reliably determined from snapshot or reviews array,
    // do not fabricate it or generate opportunities
    if (clinicReviewCount === null || isNaN(clinicReviewCount) || clinicReviewCount < 0) {
      return [];
    }

    const opportunities: EvaluatedOpportunity[] = [];
    const seenCompetitors = new Set<string>();

    for (const comp of items) {
      if (!comp || typeof comp !== "object") continue;
      if (comp.isYou === true || comp.id === "you") continue;

      const compName = (comp.name || "").toString().trim();
      if (!compName) continue;

      const compReviewCount =
        typeof comp.reviewCount === "number"
          ? comp.reviewCount
          : (typeof comp.user_ratings_total === "number" ? comp.user_ratings_total : null);

      // Verify competitor review count is available; do NOT fabricate missing values
      if (compReviewCount === null || isNaN(compReviewCount) || compReviewCount < 0) {
        continue;
      }

      // Review gap calculation: must be strictly > 20
      const reviewGap = compReviewCount - clinicReviewCount;
      if (reviewGap <= 20) continue;

      const rawCompId = (comp.placeId || comp.id || compName).toString().trim();
      const normalizedCompId = rawCompId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const entityKey = `competitor:${normalizedCompId}`;

      if (seenCompetitors.has(entityKey)) continue;
      seenCompetitors.add(entityKey);

      // Deterministic priority: HIGH if gap >= 50, MEDIUM if gap > 20
      const priority: OpportunityPriority = reviewGap >= 50 ? "HIGH" : "MEDIUM";

      const suggestedActions: OpportunityAction[] = [
        {
          label: "View Competitors",
          actionType: "OPEN_COMPETITORS",
          route: "/local-seo?tab=competitors",
        },
      ];

      opportunities.push({
        category: "COMPETITORS",
        type: "COMPETITOR_REVIEW_GAP",
        entityKey,
        title: `Address review deficit vs. ${compName} (+${reviewGap} reviews)`,
        summary: `Observed review gap of ${reviewGap} reviews (${compReviewCount} vs ${clinicReviewCount}).`,
        evidence: {
          metric: "Review Count Gap",
          observedValue: `Competitor: ${compReviewCount} reviews vs Clinic: ${clinicReviewCount} reviews`,
          benchmark: "> 20 reviews gap",
          context: `${compName} has ${reviewGap} more observed reviews than the clinic (${compReviewCount} vs ${clinicReviewCount}).`,
          source: "CompetitorSnapshot",
        },
        opportunity: `${compName} has an observed review-count advantage of ${reviewGap} reviews (${compReviewCount} vs ${clinicReviewCount}).`,
        suggestedActions,
        priority,
        impact: "Local patient social proof",
        metadata: {
          competitorName: compName,
          competitorPlaceId: comp.placeId || comp.id || null,
          competitorReviewCount: compReviewCount,
          competitorRating: typeof comp.rating === "number" ? comp.rating : null,
          competitorRank: typeof comp.rank === "number" ? comp.rank : null,
          clinicReviewCount,
          reviewGap,
          distanceMeters: typeof comp.distanceMeters === "number" ? comp.distanceMeters : null,
          snapshotDate: snapshot.date || snapshot.createdAt || null,
        },
      });
    }

    // Sort by largest review gap descending
    return opportunities.sort((a, b) => {
      const gapA = a.metadata?.reviewGap ?? 0;
      const gapB = b.metadata?.reviewGap ?? 0;
      return gapB - gapA;
    });
  }

  /**
   * Phase 4B Evaluator: Reputation & Review Response
   * Data consumed: prisma.review (unresponded reviews).
   *
   * Threshold:
   * - 5+ unanswered reviews -> HIGH
   * - 1–4 unanswered reviews -> MEDIUM
   * - 0 unanswered reviews -> no opportunity
   *
   * Zero unsupported causal claims regarding ranking penalties or benefits.
   */
  static async evaluateReputationOpportunities(context: OpportunityEvaluationContext): Promise<EvaluatedOpportunity[]> {
    let reviews: any[] | null = null;

    if (Array.isArray(context.doctorReviews)) {
      reviews = context.doctorReviews;
    } else if (context.doctorId) {
      try {
        reviews = await prisma.review.findMany({
          where: { doctorId: context.doctorId },
          orderBy: { reviewDate: "desc" },
        });
      } catch {
        reviews = null;
      }
    }

    // If review dataset is missing or unreliable, do not generate a fabricated opportunity
    if (!Array.isArray(reviews)) {
      return [];
    }

    // Identify reviews without a recorded response
    const unansweredReviews = reviews.filter((r) => {
      if (!r || typeof r !== "object") return false;
      const isResponded = r.responded === true || Boolean(r.reply && String(r.reply).trim().length > 0);
      return !isResponded;
    });

    const unansweredCount = unansweredReviews.length;

    // 0 unanswered reviews -> no opportunity
    if (unansweredCount === 0) {
      return [];
    }

    // Priority: 5+ -> HIGH, 1-4 -> MEDIUM
    const priority: OpportunityPriority = unansweredCount >= 5 ? "HIGH" : "MEDIUM";

    const suggestedActions: OpportunityAction[] = [
      {
        label: "Respond to Reviews",
        actionType: "OPEN_REVIEWS",
        route: "/reviews",
      },
    ];

    const entityKey = "reviews:unanswered";

    const opportunity: EvaluatedOpportunity = {
      category: "REVIEWS",
      type: "UNANSWERED_REVIEWS",
      entityKey,
      title: `Respond to ${unansweredCount} pending patient reviews`,
      summary: `${unansweredCount} patient reviews are currently awaiting a response.`,
      evidence: {
        metric: "Unanswered Reviews",
        observedValue: String(unansweredCount),
        benchmark: "0 unanswered reviews",
        context: `${unansweredCount} observed reviews currently have no recorded response.`,
        source: "Database Reviews",
      },
      opportunity: `${unansweredCount} observed reviews currently have no recorded response.`,
      suggestedActions,
      priority,
      impact: "Patient engagement and satisfaction",
      metadata: {
        totalReviews: reviews.length,
        unansweredCount,
        unansweredRatio: reviews.length > 0 ? Math.round((unansweredCount / reviews.length) * 100) / 100 : 0,
        oldestUnansweredDate: unansweredReviews[unansweredReviews.length - 1]?.reviewDate || null,
      },
    };

    return [opportunity];
  }

  /**
   * Phase 5 Evaluator: Content Cadence
   * Data consumed: GbpPostSnapshot (recency of last Google update).
   *
   * Threshold: STALENESS = last Google Post >= 14 days old (proposed V1 opportunity threshold).
   * Priority:
   * - HIGH: No observed posts in snapshot OR last post >= 30 days old.
   * - MEDIUM: Last post >= 14 days and < 30 days old.
   * - (No opportunity generated if last post < 14 days old).
   *
   * Zero unsupported causal claims regarding ranking or local pack rewards.
   */
  static async evaluateContentOpportunities(context: OpportunityEvaluationContext): Promise<EvaluatedOpportunity[]> {
    let snapshot = context.postSnapshot;
    if (!snapshot && context.gbpAccountId) {
      snapshot = await prisma.gbpPostSnapshot.findFirst({
        where: { gbpAccountId: context.gbpAccountId },
        orderBy: { date: "desc" },
      });
    }

    // Secondary fallback: Check published posts in GBPPost if doctorId is available
    if (!snapshot && context.doctorId) {
      try {
        const localPosts = await prisma.gBPPost.findMany({
          where: { doctorId: context.doctorId, status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 10,
        });
        if (localPosts.length > 0) {
          snapshot = { posts: localPosts, source: "GBPPost" };
        }
      } catch {
        snapshot = null;
      }
    }

    if (!snapshot) return [];

    let rawData: any = snapshot.json ?? snapshot;
    if (typeof rawData === "string") {
      try {
        rawData = JSON.parse(rawData);
      } catch {
        return [];
      }
    }

    let items: any[] | null = null;
    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (rawData && typeof rawData === "object") {
      if (Array.isArray(rawData.localPosts)) {
        items = rawData.localPosts;
      } else if (Array.isArray(rawData.posts)) {
        items = rawData.posts;
      } else if (Array.isArray(rawData.items)) {
        items = rawData.items;
      }
    }

    // If the data structure cannot be verified as an array, do not fabricate an opportunity
    if (!Array.isArray(items)) {
      return [];
    }

    const entityKey = "content:google-post-cadence";
    const suggestedActions: OpportunityAction[] = [
      {
        label: "Open Google Posts",
        actionType: "OPEN_POSTS",
        route: "/gbp/posts",
      },
    ];

    // Case 1: Empty post array reliably establishes absence in available snapshot
    if (items.length === 0) {
      const opportunity: EvaluatedOpportunity = {
        category: "CONTENT",
        type: "CONTENT_CADENCE",
        entityKey,
        title: "Publish a Google Business Profile update",
        summary: "No Google Posts were found in the available post snapshot.",
        evidence: {
          metric: "Google Post Recency",
          observedValue: "No observed posts",
          benchmark: "14 days",
          context: "No Google Posts were found in the available post snapshot.",
          source: snapshot.source || "GbpPostSnapshot",
        },
        opportunity: "No Google Posts were found in the available post snapshot.",
        suggestedActions,
        priority: "HIGH",
        impact: "Profile freshness and patient communication",
        metadata: {
          totalObservedPosts: 0,
          daysSinceLastPost: null,
          lastPostDate: null,
        },
      };
      return [opportunity];
    }

    // Case 2: Extract timestamps and determine the most recent valid post
    const validTimestamps: Date[] = [];
    for (const post of items) {
      if (!post || typeof post !== "object") continue;
      const rawTimestamp =
        post.publishedAt ??
        post.createTime ??
        post.updateTime ??
        post.createdAt ??
        post.date;

      if (!rawTimestamp) continue;
      const d = new Date(rawTimestamp);
      if (!isNaN(d.getTime())) {
        validTimestamps.push(d);
      }
    }

    // If no post has a valid timestamp, do NOT fabricate an opportunity
    if (validTimestamps.length === 0) {
      return [];
    }

    const latestDate = new Date(Math.max(...validTimestamps.map((t) => t.getTime())));
    const now = new Date();
    const diffMs = now.getTime() - latestDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Current/recent post: < 14 days old -> no opportunity generated
    if (diffDays < 14) {
      return [];
    }

    // Priority: Last post >= 30 days old is HIGH; between 14 and 29 days is MEDIUM
    const priority: OpportunityPriority = diffDays >= 30 ? "HIGH" : "MEDIUM";

    const opportunity: EvaluatedOpportunity = {
      category: "CONTENT",
      type: "CONTENT_CADENCE",
      entityKey,
      title: `Publish a Google Business Profile update (${diffDays} days since last post)`,
      summary: `The latest observed Google Post is ${diffDays} days old.`,
      evidence: {
        metric: "Days Since Last Google Post",
        observedValue: `${diffDays} days`,
        benchmark: "14 days",
        context: `Latest observed Google Post was published ${diffDays} days ago.`,
        source: snapshot.source || "GbpPostSnapshot",
      },
      opportunity: `The latest observed Google Post is ${diffDays} days old.`,
      suggestedActions,
      priority,
      impact: "Profile freshness and patient communication",
      metadata: {
        daysSinceLastPost: diffDays,
        lastPostDate: latestDate.toISOString(),
        totalObservedPosts: items.length,
      },
    };

    return [opportunity];
  }

  /**
   * Central evaluation coordinator.
   * Runs all active category evaluators and aggregates opportunities.
   */
  static async evaluateAll(context: OpportunityEvaluationContext): Promise<EvaluatedOpportunity[]> {
    const [ranking, grid, competitors, reputation, content] = await Promise.all([
      this.evaluateRankingOpportunities(context),
      this.evaluateSearchGridOpportunities(context),
      this.evaluateCompetitorOpportunities(context),
      this.evaluateReputationOpportunities(context),
      this.evaluateContentOpportunities(context),
    ]);

    const combined = [...ranking, ...grid, ...competitors, ...reputation, ...content];
    return this.applyOpportunityCaps(combined);
  }

  /**
   * Phase 6: Deterministic Persistence & Reconciliation Engine.
   * Reconciles evaluated growth opportunities with the existing SeoRecommendation database model.
   *
   * Safety Guarantees:
   * 1. Deterministic deduplication: category:type:entityKey.
   * 2. PENDING reuse: Updates existing PENDING record (refreshes evidence/metrics) without creating duplicate rows.
   * 3. COMPLETED preservation: Never duplicates or overwrites COMPLETED recommendations.
   * 4. DISMISSED suppression: Honors 30-day suppression window and prevents duplicate creation.
   * 5. EXPIRED handling: Safely transitions no-longer-active PENDING opportunities to EXPIRED without deletion.
   * 6. Legacy safety: NEVER deletes, rewrites, or mutates legacy Profile Health tasks.
   * 7. Cap compliance: Only active evaluated opportunities within caps are submitted for reconciliation.
   */
  static async reconcileOpportunities(
    context: OpportunityEvaluationContext,
    evaluatedOpportunities: EvaluatedOpportunity[],
    options?: ReconciliationOptions
  ): Promise<ReconciliationResult> {
    const expireUnmatched = options?.expireUnmatchedPending ?? true;
    const suppressionDays = options?.dismissalSuppressionDays ?? 30;

    // Load all existing recommendations for this GBP account
    const existingRecs = await prisma.seoRecommendation.findMany({
      where: { gbpAccountId: context.gbpAccountId },
      orderBy: [
        { status: "desc" },
        { createdAt: "desc" },
      ],
    });

    let createdCount = 0;
    let updatedCount = 0;
    let preservedCompletedCount = 0;
    let suppressedDismissedCount = 0;
    let expiredCount = 0;

    // Index existing records by deduplication key (only for version 1 opportunities)
    // Legacy records (no version 1 or type === LEGACY) are preserved untouched
    const existingByDedupKey = new Map<string, SeoRecommendation>();
    for (const rec of existingRecs) {
      const payload = this.decodePayload(rec.description, rec.title, rec.category);
      if (payload.version === 1 && payload.type !== "LEGACY" && payload.type !== "LEGACY_TASK") {
        const key = payload.metadata?.dedupKey || this.constructDeduplicationKey(rec.category as OpportunityCategory, payload.type, payload.entityKey);
        if (!existingByDedupKey.has(key)) {
          existingByDedupKey.set(key, rec);
        }
      }
    }

    const matchedDedupKeys = new Set<string>();

    // Process each newly evaluated opportunity
    for (const opp of evaluatedOpportunities) {
      const dedupKey = this.constructDeduplicationKey(opp.category, opp.type, opp.entityKey);
      matchedDedupKeys.add(dedupKey);

      const existing = existingByDedupKey.get(dedupKey);

      if (!existing) {
        // CASE A: No existing record found -> CREATE new PENDING recommendation
        await prisma.seoRecommendation.create({
          data: {
            gbpAccountId: context.gbpAccountId,
            category: opp.category,
            title: opp.title,
            description: this.encodePayload(opp),
            priority: opp.priority,
            impact: opp.impact || null,
            status: "PENDING",
          },
        });
        createdCount++;
      } else if (existing.status === "PENDING") {
        // CASE B: Existing PENDING record -> UPDATE details and refresh evidence (preserves id, createdAt, account)
        await prisma.seoRecommendation.update({
          where: { id: existing.id },
          data: {
            title: opp.title,
            description: this.encodePayload(opp),
            priority: opp.priority,
            impact: opp.impact || null,
          },
        });
        updatedCount++;
      } else if (existing.status === "COMPLETED") {
        // CASE C: Existing COMPLETED record -> Preserve completed state, DO NOT duplicate
        preservedCompletedCount++;
      } else if (existing.status === "DISMISSED") {
        // CASE D: Existing DISMISSED record -> Check suppression window
        const daysSinceDismissal = (Date.now() - new Date(existing.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissal < suppressionDays) {
          suppressedDismissedCount++;
        } else {
          // Beyond suppression window: safely preserve dismissed state
          suppressedDismissedCount++;
        }
      }
    }

    // Handle previously PENDING opportunities whose underlying signal has resolved
    if (expireUnmatched) {
      for (const [key, rec] of existingByDedupKey.entries()) {
        if (!matchedDedupKeys.has(key) && rec.status === "PENDING") {
          await prisma.seoRecommendation.update({
            where: { id: rec.id },
            data: { status: "EXPIRED" },
          });
          expiredCount++;
        }
      }
    }

    // Reload all recommendations to return up-to-date state
    const allRecommendations = await prisma.seoRecommendation.findMany({
      where: { gbpAccountId: context.gbpAccountId },
      orderBy: [
        { status: "desc" },
        { createdAt: "desc" },
      ],
    });

    const activeOpportunities = allRecommendations
      .filter((r) => r.status === "PENDING")
      .map((r) => this.hydrateRecommendation(r));

    return {
      createdCount,
      updatedCount,
      preservedCompletedCount,
      suppressedDismissedCount,
      expiredCount,
      allRecommendations,
      activeOpportunities,
    };
  }
}
