<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:whatsapp-module-rules -->
# WhatsApp Platform Architectural Scope Freeze
## Permanent Architectural Decisions
- messagingEngine: Baileys QR-based WhatsApp Business connection
- officialCloudAPI: false
- officialTemplates: false
- metaBusinessManager: false
- metaWebhookArchitecture: false
- templateApprovalFlow: false
- phoneNumberRegistration: false
- marketingAutomation: false
- bulkCampaignPlatform: false

## Supported Capabilities
- QR Code Connection
- Clinic WhatsApp Business Connection
- Unified Inbox
- Patient Conversations
- Lead Conversations
- Appointment Confirmations
- Appointment Reminders
- Follow-up Messages
- Feedback Requests
- Google Review Requests
- Invoice Sharing
- Receipt Sharing
- AI Appointment Assistant
- Conversation Assignment
- Audit Logging

## Unsupported Capabilities (DO NOT IMPLEMENT)
- Meta Cloud API
- Official WhatsApp Templates
- Meta Business Verification
- Cloud API Webhooks
- Marketing Campaign Platform
- Template Approval Workflow
- Authentication Templates
- Utility Templates
- Official Business API Registration

<!-- END:whatsapp-module-rules -->

<!-- BEGIN:local-seo-opportunity-engine-freeze -->
# Local SEO Opportunity Engine — Architectural Scope & Integration Freeze
## Permanent Architectural Decisions
- status: FROZEN
- integrationContract: Shared version 1 JSON payload in `SeoRecommendation.description`
- contractDefinition: `src/types/local-seo-opportunity.ts`
- backendOrchestrator: `src/services/local-seo-opportunity.service.ts`
- frontendNormalizer: `src/app/(dashboard)/local-seo/components/opportunity-ui.ts`
- frontendList: `src/app/(dashboard)/local-seo/components/RecommendationsList.tsx`
- databaseMigration: false (No new Prisma models, columns, or database migrations)
- aiGenerators: false (Purely deterministic heuristic evaluators; no LLMs/AI in opportunity generation)
- decoupledProfileHealth: true (Profile Health owns listing completeness; Recommendations owns growth opportunities)
- evidenceOnlyLanguage: true (Strictly no ranking, traffic, or patient acquisition guarantees)
- opportunityCaps: Maximum 2 per category, Maximum 6 active opportunities globally per account
- legacyCompatibility: Full backward-compatibility with plain-text descriptions; raw JSON never exposed

## Supported Evaluators & Actions
1. **Ranking**: `STRIKING_DISTANCE` (observed rank #4–#8 on center pin) $\to$ `OPEN_RANK_TRACKER` (`/local-seo?tab=rank-tracker&keyword=...`)
2. **Geographic**: `WEAK_GEOGRAPHIC_VISIBILITY` ($\ge 40\%$ weak cells) $\to$ `OPEN_SEARCH_GRID` (`/local-seo?tab=rank-tracker`)
3. **Competitors**: `COMPETITOR_REVIEW_GAP` (gap $> 20$ reviews vs top competitor) $\to$ `OPEN_COMPETITORS` (`/local-seo?tab=competitors`)
4. **Reputation**: `UNANSWERED_REVIEWS` ($\ge 1$ unanswered reviews) $\to$ `OPEN_REVIEWS` (`/reviews`)
5. **Content**: `CONTENT_CADENCE` ($\ge 14$ days since last Google Post) $\to$ `OPEN_POSTS` (`/gbp/posts`)

## Unsupported Capabilities (DO NOT IMPLEMENT)
- New Prisma schema migrations or additional columns on `SeoRecommendation`
- Re-introducing Profile Health checks (hours, phone, website URL, description length) into Recommendations
- Unsupported ranking, traffic, or click guarantees ("Google favors", "will rank higher")
- Arbitrary numerical opportunity scoring or overall 0–100 scores
- Additional opportunity categories (Services, Conversion, AI Opportunities, Competitor Velocity)
- Meta Cloud API or external ad platform integrations

**Critical Rule**: The contract between the backend Opportunity Engine and the frontend UI is frozen at version 1. Do not modify the payload shape or evaluator thresholds without an explicit architecture review.
<!-- END:local-seo-opportunity-engine-freeze -->

