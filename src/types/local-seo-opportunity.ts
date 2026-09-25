/**
 * Gyrex Local SEO — Opportunity Engine Integration Contract [STATUS: ARCHITECTURALLY FROZEN]
 * Shared contract between Workstream A (Backend Opportunity Engine) and Workstream B (Frontend UI).
 *
 * ARCHITECTURAL CONSTRAINTS:
 * 1. WORKSTREAM A writes a structured version 1 JSON payload into the existing
 *    Prisma `SeoRecommendation.description` field.
 * 2. WORKSTREAM B reads, validates, normalizes, and renders that JSON payload.
 * 3. Legacy plain-text descriptions (e.g. "Your business hours are incomplete.") remain 100% supported.
 * 4. The database schema deliberately remains unchanged (zero migrations, zero new models/columns).
 * 5. This contract and its runtime validator are frozen at Version 1.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. VERSION & ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type OpportunityPayloadVersion = 1;

export type OpportunityCategory =
  | "RANKING"
  | "SEARCH_GRID"
  | "COMPETITORS"
  | "REVIEWS"
  | "CONTENT";

export type OpportunityPriority = "HIGH" | "MEDIUM" | "LOW";

export type OpportunityActionType =
  | "OPEN_RANK_TRACKER"
  | "OPEN_SEARCH_GRID"
  | "OPEN_COMPETITORS"
  | "OPEN_REVIEWS"
  | "OPEN_POSTS"
  | "OPEN_PROFILE_HEALTH";

// ─────────────────────────────────────────────────────────────────────────────
// 2. PAYLOAD CONTRACT INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface OpportunityAction {
  label: string;
  actionType: OpportunityActionType | string;
  route: string;
  payload?: Record<string, any>;
}

export interface OpportunityEvidence {
  metric: string;
  observedValue: string | number;
  benchmark?: string | number;
  context: string;
  source?: string;
}

export interface StructuredOpportunityPayload {
  version: OpportunityPayloadVersion;
  type: string;
  entityKey: string;
  summary: string;
  evidence: OpportunityEvidence;
  opportunity: string;
  suggestedActions: OpportunityAction[];
  metadata?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RUNTIME PARSER & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export type ParsedOpportunityDescription =
  | {
      kind: "structured";
      payload: StructuredOpportunityPayload;
    }
  | {
      kind: "legacy";
      description: string;
    };

/**
 * Lightweight, safe runtime validator for SeoRecommendation.description strings.
 *
 * Guarantees:
 * 1. Accepts valid structured v1 JSON payloads.
 * 2. Rejects unsupported/future versions (e.g. version: 2) and falls back safely to legacy.
 * 3. Rejects non-objects, arrays, and malformed JSON safely without throwing.
 * 4. Validates required contract fields (type, entityKey, summary, opportunity, evidence, actions).
 * 5. Accepts optional metadata and benchmark fields without failure.
 * 6. Never throws an unhandled exception to the UI or API.
 */
export function parseRecommendationDescription(
  rawDescription: string | null | undefined
): ParsedOpportunityDescription {
  if (!rawDescription || typeof rawDescription !== "string") {
    return { kind: "legacy", description: "" };
  }

  const trimmed = rawDescription.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return { kind: "legacy", description: rawDescription };
  }

  try {
    const parsed = JSON.parse(trimmed);

    // Must be a non-null object, NOT an array
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { kind: "legacy", description: rawDescription };
    }

    // Version gate: Strictly version 1 is supported
    if (parsed.version !== 1) {
      return { kind: "legacy", description: rawDescription };
    }

    // Required string fields
    if (typeof parsed.type !== "string" || !parsed.type.trim()) {
      return { kind: "legacy", description: rawDescription };
    }

    if (typeof parsed.entityKey !== "string" || !parsed.entityKey.trim()) {
      return { kind: "legacy", description: rawDescription };
    }

    if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
      return { kind: "legacy", description: rawDescription };
    }

    if (typeof parsed.opportunity !== "string" || !parsed.opportunity.trim()) {
      return { kind: "legacy", description: rawDescription };
    }

    // Required evidence object
    if (!parsed.evidence || typeof parsed.evidence !== "object" || Array.isArray(parsed.evidence)) {
      return { kind: "legacy", description: rawDescription };
    }

    if (
      typeof parsed.evidence.metric !== "string" ||
      parsed.evidence.observedValue === undefined ||
      parsed.evidence.observedValue === null
    ) {
      return { kind: "legacy", description: rawDescription };
    }

    // Suggested actions array
    const actionsRaw = parsed.suggestedActions ?? parsed.actions;
    if (!Array.isArray(actionsRaw)) {
      return { kind: "legacy", description: rawDescription };
    }

    const validatedActions: OpportunityAction[] = [];
    for (const act of actionsRaw) {
      if (act && typeof act === "object" && typeof act.label === "string") {
        validatedActions.push({
          label: act.label,
          actionType: (act.actionType || act.type || "OPEN_PROFILE_HEALTH") as OpportunityActionType,
          route: typeof act.route === "string" ? act.route : "/local-seo",
          payload: act.payload && typeof act.payload === "object" ? act.payload : undefined,
        });
      }
    }

    const payload: StructuredOpportunityPayload = {
      version: 1,
      type: parsed.type,
      entityKey: parsed.entityKey,
      summary: parsed.summary,
      evidence: {
        metric: parsed.evidence.metric,
        observedValue: parsed.evidence.observedValue,
        benchmark: parsed.evidence.benchmark,
        context: typeof parsed.evidence.context === "string" ? parsed.evidence.context : "",
        source: typeof parsed.evidence.source === "string" ? parsed.evidence.source : undefined,
      },
      opportunity: parsed.opportunity,
      suggestedActions: validatedActions,
      metadata: parsed.metadata && typeof parsed.metadata === "object" ? parsed.metadata : undefined,
    };

    return {
      kind: "structured",
      payload,
    };
  } catch {
    return { kind: "legacy", description: rawDescription };
  }
}
