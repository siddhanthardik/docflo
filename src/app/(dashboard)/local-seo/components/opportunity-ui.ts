/**
 * Local SEO Opportunity Engine - Frontend UI Types & Normalization Helpers
 * Phase 7 & Phase 8 - Gyrex Local SEO
 *
 * Uses the shared contract defined in @/types/local-seo-opportunity.
 */

import {
  OpportunityPayloadVersion,
  OpportunityCategory,
  OpportunityPriority,
  OpportunityActionType,
  OpportunityAction,
  OpportunityEvidence,
  StructuredOpportunityPayload,
  ParsedOpportunityDescription,
  parseRecommendationDescription,
} from "@/types/local-seo-opportunity";

// Re-export contract types for UI consumers
export type {
  OpportunityPayloadVersion,
  OpportunityCategory,
  OpportunityPriority,
  OpportunityActionType,
  OpportunityAction,
  OpportunityEvidence,
  StructuredOpportunityPayload,
  ParsedOpportunityDescription,
};

export { parseRecommendationDescription };

export interface RawRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  impact?: string | null;
  status: string;
  createdAt: string;
}

export type OpportunityDisplayCategory =
  | "RANKING"
  | "GEOGRAPHIC"
  | "COMPETITORS"
  | "REPUTATION"
  | "CONTENT"
  | "LEGACY";

export interface NormalizedOpportunity {
  id: string;
  rawCategory: string;
  displayCategory: OpportunityDisplayCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  impact?: string;
  status: string;
  isStructured: boolean;
  evidence?: OpportunityEvidence;
  opportunityText?: string;
  actions: OpportunityAction[];
  legacyDescription?: string;
  createdAt: string;
}

/**
 * Maps raw backend category/type to one of the 5 approved opportunity categories:
 * 1. RANKING OPPORTUNITIES
 * 2. GEOGRAPHIC VISIBILITY
 * 3. COMPETITOR OPPORTUNITIES
 * 4. REPUTATION OPPORTUNITIES
 * 5. CONTENT CADENCE
 */
export function resolveDisplayCategory(
  category: string,
  type?: string
): { displayCategory: OpportunityDisplayCategory; categoryLabel: string } {
  const normCat = (category || "").toUpperCase();
  const normType = (type || "").toUpperCase();

  if (normType === "STRIKING_DISTANCE" || normCat === "RANKING") {
    return { displayCategory: "RANKING", categoryLabel: "Ranking" };
  }
  if (normType === "WEAK_GEOGRAPHIC_VISIBILITY" || normCat === "SEARCH_GRID") {
    return { displayCategory: "GEOGRAPHIC", categoryLabel: "Geographic" };
  }
  if (normCat === "COMPETITORS" || normType.includes("COMPETITOR")) {
    return { displayCategory: "COMPETITORS", categoryLabel: "Competitors" };
  }
  if (normCat === "REVIEWS" || normType.includes("REVIEW")) {
    return { displayCategory: "REPUTATION", categoryLabel: "Reputation" };
  }
  if (normCat === "CONTENT" || normCat === "POSTS" || normType.includes("CONTENT") || normType.includes("POST")) {
    return { displayCategory: "CONTENT", categoryLabel: "Content" };
  }

  // Fallback for legacy profile optimization items
  return { displayCategory: "LEGACY", categoryLabel: "Optimization" };
}

/**
 * Safely parses and normalizes a SeoRecommendation into a NormalizedOpportunity
 * using the shared parseRecommendationDescription contract validator.
 *
 * Guarantees:
 * - Structured v1 JSON -> Opportunity Engine UI.
 * - Legacy plain text -> Legacy recommendation UI.
 * - Malformed / unsupported version -> Graceful fallback to legacy text (never exposes raw JSON or throws).
 */
export function normalizeOpportunity(rec: RawRecommendation): NormalizedOpportunity {
  const parsed = parseRecommendationDescription(rec.description);

  const priorityUpper = (rec.priority || "MEDIUM").toUpperCase();
  const priority: "HIGH" | "MEDIUM" | "LOW" =
    priorityUpper === "HIGH" || priorityUpper === "CRITICAL"
      ? "HIGH"
      : priorityUpper === "LOW"
      ? "LOW"
      : "MEDIUM";

  if (parsed.kind === "structured") {
    const payload = parsed.payload;
    const { displayCategory, categoryLabel } = resolveDisplayCategory(
      rec.category,
      payload.type
    );

    // Ensure at least one action is available if suggestedActions array is empty
    let actions = payload.suggestedActions;
    if (!actions || actions.length === 0) {
      if (displayCategory === "RANKING" || displayCategory === "GEOGRAPHIC") {
        actions = [{ label: "Open Rank Tracker", actionType: "OPEN_RANK_TRACKER", route: "/local-seo?tab=rank-tracker" }];
      } else if (displayCategory === "COMPETITORS") {
        actions = [{ label: "View Competitors", actionType: "OPEN_COMPETITORS", route: "/local-seo?tab=competitors" }];
      } else if (displayCategory === "REPUTATION") {
        actions = [{ label: "Open Reviews", actionType: "OPEN_REVIEWS", route: "/reviews" }];
      } else if (displayCategory === "CONTENT") {
        actions = [{ label: "Create Google Post", actionType: "OPEN_POSTS", route: "/gbp/posts" }];
      } else {
        actions = [{ label: "View Details", actionType: "OPEN_PROFILE_HEALTH", route: "/local-seo?tab=profile-health" }];
      }
    }

    return {
      id: rec.id,
      rawCategory: rec.category,
      displayCategory,
      categoryLabel,
      title: rec.title,
      summary: payload.summary || payload.opportunity || rec.title,
      priority,
      impact: rec.impact || undefined,
      status: rec.status,
      isStructured: true,
      evidence: payload.evidence,
      opportunityText: payload.opportunity,
      actions,
      createdAt: rec.createdAt,
    };
  }

  // Legacy plain-text fallback
  const rawDesc = parsed.description;
  const { displayCategory, categoryLabel } = resolveDisplayCategory(rec.category);

  // Synthesize legacy action from category/title
  const catUpper = (rec.category || "").toUpperCase();
  const titleLower = (rec.title || "").toLowerCase();
  let defaultAction: OpportunityAction;

  if (catUpper === "REVIEWS" || titleLower.includes("review")) {
    defaultAction = { label: "Open Reviews", actionType: "OPEN_REVIEWS", route: "/reviews" };
  } else if (catUpper === "CONTENT" || titleLower.includes("post") || titleLower.includes("update")) {
    const match = rec.title.match(/"([^"]+)"/);
    const kw = match ? match[1] : "";
    const route = kw ? `/gbp/posts?draftKeyword=${encodeURIComponent(kw)}` : "/gbp/posts";
    defaultAction = { label: "Create Update", actionType: "OPEN_POSTS", route };
  } else {
    defaultAction = { label: "Edit Profile Details", actionType: "OPEN_PROFILE_HEALTH", route: "/local-seo?tab=profile-health" };
  }

  return {
    id: rec.id,
    rawCategory: rec.category,
    displayCategory,
    categoryLabel,
    title: rec.title,
    summary: rawDesc,
    priority,
    impact: rec.impact || undefined,
    status: rec.status,
    isStructured: false,
    legacyDescription: rawDesc,
    actions: [defaultAction],
    createdAt: rec.createdAt,
  };
}

/**
 * Handles action routing for contextual opportunity buttons.
 * Routes to existing Gyrex destinations without dead links or page duplication.
 */
export function executeOpportunityAction(
  action: OpportunityAction,
  router: { push: (url: string) => void },
  onNavigateTab?: (tab: "overview" | "rank-tracker" | "competitors" | "profile-health" | "recommendations") => void
) {
  switch (action.actionType) {
    case "OPEN_RANK_TRACKER":
    case "OPEN_SEARCH_GRID":
      if (onNavigateTab) {
        onNavigateTab("rank-tracker");
      }
      if (action.route && action.route.includes("keyword=")) {
        router.push(action.route);
      } else {
        router.push("/local-seo?tab=rank-tracker");
      }
      break;

    case "OPEN_COMPETITORS":
      if (onNavigateTab) {
        onNavigateTab("competitors");
      }
      router.push(action.route || "/local-seo?tab=competitors");
      break;

    case "OPEN_PROFILE_HEALTH":
      if (onNavigateTab) {
        onNavigateTab("profile-health");
      }
      router.push(action.route || "/local-seo?tab=profile-health");
      break;

    case "OPEN_REVIEWS":
      router.push(action.route || "/reviews");
      break;

    case "OPEN_POSTS":
      router.push(action.route || "/gbp/posts");
      break;

    default:
      if (action.route) {
        router.push(action.route);
      } else {
        router.push("/local-seo");
      }
      break;
  }
}
