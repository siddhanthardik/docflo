# Technical Design Specification (TDS): Subscription & Entitlement Engine

This document details the engineering design for implementing the Subscription & Feature Architecture. No code is modified in this phase. The goal is to align on the technical implementation strategy before execution.

---

## 1. Entitlement Resolution Flow

The entitlement engine resolves a doctor's subscription tier into concrete access rules on every request.

**Request Lifecycle:**
1. **Authentication Intercept**: A user accesses a protected Next.js Page or API route. NextAuth resolves the session, providing the `doctorId`.
2. **Entitlement Hydration**: The `EntitlementService` fetches the Doctor's active `Package`, including its joined `PackageModule` and `PackageLimit` tables.
3. **Caching**: To prevent 3 extra DB queries per page load, the resolved entitlement object (`{ modules: [...], limits: {...} }`) is cached via Next.js `unstable_cache` or a Redis layer, keyed by `doctorId_packageId`. It is invalidated only when a subscription upgrades/downgrades.
4. **Current Usage Resolution**: Usage meters (e.g., current staff count) are calculated *lazy-loaded* only when a specific limit check is requested, preventing heavy `COUNT(*)` queries on every page load.
5. **Contextual Availability**: The application code strictly evaluates against this resolved entitlement object, never querying the `Package` table directly.

---

## 2. Usage Meter Design

Every volume limit in DocFlo must have a strict definition of how it is metered.

| Limit Name | What is Counted? | Storage Location | When Incremented? | Can it Decrement? | When is it Reset? | Limit Reached Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MAX_STAFF_SEATS` | Total rows in `StaffMember` for `doctorId` | DB `COUNT()` on the fly | POST `/api/staff` | Yes, on staff deletion | Never (Absolute Volume) | 403 Forbidden / UI Blocked |
| `MAX_PATIENTS` | Total rows in `Patient` for `doctorId` | DB `COUNT()` on the fly | POST `/api/patients` & Webhook auto-create | Yes, on deletion | Never (Absolute Volume) | 402 Payment Required |
| `MAX_GBP_LOCATIONS`| Total rows in `GbpAccount` for `doctorId` | DB `COUNT()` on the fly | POST `/api/gbp/connect` | Yes, on disconnection | Never (Absolute Volume) | 403 Forbidden / UI Blocked |
| `MAX_TRACKED_KEYWORDS`| Length of `localSeoKeywords` array in GBP Insights | Inside `GbpAccount.insightsData` JSON | PUT `/api/gbp/local-seo` | Yes, when keyword removed | Never (Absolute Volume) | 403 Forbidden / UI Blocked |
| `MAX_SCHEDULED_POSTS`| Total `GBPPost` rows created this billing cycle | DB `COUNT()` with date filter | POST `/api/gbp/posts` | No (Consumption based) | First day of billing cycle | 402 Payment Required |
| `AI_CREDITS_PER_MONTH`| Total AI executions (Responses, GBP generation) | `Doctor.currentAiCredits` Integer column | Every `ai-agents.service.ts` execution | No (Consumption based) | First day of billing cycle | Fallback to Staff / AI stops replying |

---

## 3. Enforcement Strategy

Access control checks must be centralized and predictable. Scattered `if (plan === 'PRO')` logic is strictly prohibited.

1. **Navigation Visibility (UI)**
   *   **Where**: Sidebar and Header components (`src/components/Sidebar.tsx` / `layout.tsx`).
   *   **How**: Call `await EntitlementService.hasModule(doctorId, 'GROWTH_SEO')`. If false, either hide the tab or display a lock icon indicating an upsell opportunity.
2. **Page Access (Next.js App Router)**
   *   **Where**: Top level of every Server Component (`page.tsx`).
   *   **How**: Call `await EntitlementService.requireModule(doctorId, 'WHATSAPP_CRM')`. This method automatically triggers a `redirect('/subscription/upsell')` if unauthorized.
3. **API Protection (Next.js Route Handlers)**
   *   **Where**: First line of the `GET`, `POST`, `PUT`, `DELETE` blocks in `route.ts`.
   *   **How**: Call `await EntitlementService.requireModule(doctorId, 'WHATSAPP_CRM')`. Throws a standardized `403 Forbidden` JSON response if unauthorized.
4. **Action Validation (Mutations)**
   *   **Where**: Right before a `prisma.create` or AI execution.
   *   **How**: Call `await EntitlementService.requireLimit(doctorId, 'MAX_PATIENTS')`. Throws a `402 Payment Required` if the limit is exceeded.

---

## 4. Central Entitlement Service Interface

The `EntitlementService` acts as the single source of truth for the entire application.

```typescript
export enum ModuleName {
  CLINIC_CORE = "CLINIC_CORE",
  GROWTH_SEO = "GROWTH_SEO",
  WHATSAPP_CRM = "WHATSAPP_CRM",
  AI_ASSISTANT = "AI_ASSISTANT"
}

export enum LimitName {
  MAX_STAFF_SEATS = "MAX_STAFF_SEATS",
  MAX_PATIENTS = "MAX_PATIENTS",
  MAX_GBP_LOCATIONS = "MAX_GBP_LOCATIONS",
  MAX_TRACKED_KEYWORDS = "MAX_TRACKED_KEYWORDS",
  MAX_SCHEDULED_POSTS = "MAX_SCHEDULED_POSTS",
  AI_CREDITS_PER_MONTH = "AI_CREDITS_PER_MONTH"
}

export interface EntitlementService {
  // Returns true if module is in the doctor's package
  hasModule(doctorId: string, module: ModuleName): Promise<boolean>;
  
  // Throws 403 or redirects if module is missing
  requireModule(doctorId: string, module: ModuleName): Promise<void>;
  
  // Returns allowed boolean, current usage, and max limit
  checkLimit(doctorId: string, limit: LimitName): Promise<{ allowed: boolean, current: number, max: number | null }>;
  
  // Throws 402 if limit is exceeded
  requireLimit(doctorId: string, limit: LimitName): Promise<void>;
  
  // Deducts credits or increments counters natively
  incrementUsage(doctorId: string, limit: LimitName, amount?: number): Promise<void>;
}
```

---

## 5. Current Codebase Mapping & Refactoring Plan

Every protected asset in DocFlo mapped to its new entitlement enforcement.

### UI Pages (`src/app/(dashboard)`)
| Page Path | Required Module | Required Limit | Current State | Refactor Needed |
| :--- | :--- | :--- | :--- | :--- |
| `/appointments` | `CLINIC_CORE` | None | Unprotected | Add `requireModule` |
| `/billing` | `CLINIC_CORE` | None | Unprotected | Add `requireModule` |
| `/campaigns` | `WHATSAPP_CRM` | None | Unprotected | Add `requireModule` |
| `/chatbot` | `AI_ASSISTANT` | None | Hardcoded Banner | Remove banner, add `requireModule` |
| `/gbp/*` | `GROWTH_SEO` | None | Unprotected | Add `requireModule` |
| `/local-seo` | `GROWTH_SEO` | None | Unprotected | Add `requireModule` |
| `/patients` | `CLINIC_CORE` | None | Unprotected | Add `requireModule` |
| `/reports` | `CLINIC_CORE` | None | Unprotected | Add `requireModule` |
| `/reviews` | `CLINIC_CORE` | None | Unprotected | Add `requireModule` |
| `/staff` | `CLINIC_CORE` | None | Unprotected | Add `requireModule` |
| `/whatsapp` | `WHATSAPP_CRM` | None | Unprotected | Add `requireModule` |

### API Routes (`src/app/api`)
| API Route | Required Module | Action Validation (Limit Check) | Current State | Refactor Needed |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/campaigns` | `WHATSAPP_CRM` | None | Unprotected | Add `requireModule` |
| `POST /api/gbp/local-seo` | `GROWTH_SEO` | `MAX_TRACKED_KEYWORDS` | Hardcoded `if (plan === 'PRO')` | Replace with `requireLimit` |
| `POST /api/gbp/posts` | `GROWTH_SEO` | `MAX_SCHEDULED_POSTS` | Unprotected | Add `requireLimit` |
| `POST /api/patients` | `CLINIC_CORE` | `MAX_PATIENTS` | Unprotected | Add `requireLimit` |
| `POST /api/staff` | `CLINIC_CORE` | `MAX_STAFF_SEATS` | Unprotected | Add `requireLimit` |
| `GET /api/ai-agents` | `AI_ASSISTANT` | None | Uses `isFeatureEnabled` | Replace with `hasModule` |

### Background Services
| Service | Required Module | Action Validation | Refactor Needed |
| :--- | :--- | :--- | :--- |
| `whatsapp-manager.ts` (Auto-lead) | `CLINIC_CORE` | `MAX_PATIENTS` | Must silently fail/notify if patient limit reached. |
| `whatsapp-manager.ts` (AI Booking) | `AI_ASSISTANT` | `AI_CREDITS_PER_MONTH` | Call `incrementUsage()` when AI executes. |

---

## 6. Migration Strategy (Zero-Downtime)

To transition safely from the old feature flags to the new module system:

1. **Schema Deployment**: Deploy `Package`, `PackageModule`, and `PackageLimit` tables.
2. **Data Backfill (Shadow Migration)**: A script runs that maps existing subscriptions (`subscriptionStatus`, `packageId`) into the new database tables. 
3. **Implement Service**: Build the `EntitlementService` class.
4. **Shadow Enforcement**: Add the `EntitlementService` checks to APIs, but configured to *Log Only* (do not throw errors). We monitor logs for 24 hours to ensure active doctors aren't being blocked incorrectly.
5. **Hard Cutover**: Switch `EntitlementService` to strict enforcement. Delete old `isFeatureEnabled` utility functions and hardcoded plan checks.

---

## 7. Technical Risks & Mitigations

1. **Risk: Database Load on Every Request**
   * *Mitigation*: The module list (`hasModule`) is highly cacheable since packages rarely change. We will cache the Entitlement Array per doctor in memory for the duration of a request using React's `cache()` in Server Components.
2. **Risk: Webhook Silent Failures**
   * *Scenario*: A new patient messages via WhatsApp, but the clinic has hit `MAX_PATIENTS`. The system rejects the webhook.
   * *Mitigation*: The webhook gracefully catches the `QuotaExceededError`. It replies to the patient using a standard fallback message ("The clinic is currently unavailable.") and creates an *Internal System Alert* inside the clinic's dashboard to notify the doctor they need to upgrade to receive leads.
3. **Risk: AI Credit Race Conditions**
   * *Scenario*: High concurrent traffic consumes AI tokens simultaneously, bypassing limits.
   * *Mitigation*: Use Prisma's atomic `increment` for `currentAiCredits`. We allow slight overdrafting (soft cap) rather than employing complex distributed locks, prioritizing patient response speed over strict token accounting.
