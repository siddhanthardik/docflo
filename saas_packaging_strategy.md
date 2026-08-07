# Gyrex 4-Tier SaaS Packaging Strategy

Based on your new requirements, we will structure the pricing into 4 clear tiers. This perfectly isolates the highly valuable features (WhatsApp Inbox, Automations, and Autonomous AI Agents) into the top two tiers, encouraging upgrades.

Here is the revised package blueprint mapping directly to Gyrex's database `ModuleName` and `LimitName`:

---

## 1. FREE (₹0/mo) - *For new clinics getting started*
**Goal:** Basic clinic management utility.
* **Modules Included:**
  * `CLINIC_CORE`
* **Limits:**
  * `MAX_STAFF_SEATS`: 1 (Doctor only)
  * `MAX_PATIENTS`: 50
  * `MAX_PRACTITIONERS`: 1
  * `MAX_GBP_LOCATIONS`: 0
  * `MAX_TRACKED_KEYWORDS`: 0
  * `MAX_SCHEDULED_POSTS`: 0
  * `AI_CREDITS_PER_MONTH`: 0

---

## 2. STARTER (₹1499/mo) - *Grow your local presence*
**Goal:** Introduces Google Business Profile (GBP) management without unlocking the expensive WhatsApp or AI features.
* **Modules Included:**
  * `CLINIC_CORE`
  * `GROWTH_SEO`
* **Limits:**
  * `MAX_STAFF_SEATS`: 3 (Doctor + Receptionist + Assistant)
  * `MAX_PATIENTS`: Unlimited 
  * `MAX_PRACTITIONERS`: 1
  * `MAX_GBP_LOCATIONS`: 1
  * `MAX_TRACKED_KEYWORDS`: 0 (No Local SEO competitive keyword tracking)
  * `MAX_SCHEDULED_POSTS`: 4 per month
  * `AI_CREDITS_PER_MONTH`: 0 (No AI-assisted review replies or AI post generation)
* **Explicit Exclusions:** No WhatsApp CRM, No Inbox, No AI Agents.

---

## 3. GROWTH (₹2499/mo) - *Dominate your local market*
**Goal:** Unlocks standard WhatsApp automations (Surveys, Reminders) and the unified WhatsApp Inbox, plus basic AI text-generation tools (Drafting replies/posts).
* **Modules Included:**
  * `CLINIC_CORE`
  * `GROWTH_SEO`
  * `WHATSAPP_CRM` (Unlocks the WhatsApp Inbox, Appointment Reminders, and Feedback Surveys)
* **Limits:**
  * `MAX_STAFF_SEATS`: 10
  * `MAX_PATIENTS`: Unlimited
  * `MAX_PRACTITIONERS`: Up to 3
  * `MAX_GBP_LOCATIONS`: 1 
  * `MAX_TRACKED_KEYWORDS`: 10
  * `MAX_SCHEDULED_POSTS`: 15 per month
  * `AI_CREDITS_PER_MONTH`: 100 (Used strictly for clicking "Draft AI Reply" on reviews or "Generate Post" in GBP)
* **Explicit Exclusions:** Does **NOT** include the `AI_ASSISTANT` module (No Autonomous AI Receptionist, No Auto-Review Manager Agent, No Local SEO Copilot).

---

## 4. PREMIUM / AUTOPILOT (₹4999/mo) - *Fully automated clinic*
**Goal:** The ultimate tier where clinics essentially hire "AI Employees" (Agents) to handle the busywork 24/7.
* **Modules Included:**
  * `CLINIC_CORE`
  * `GROWTH_SEO`
  * `WHATSAPP_CRM`
  * `AI_ASSISTANT` (Unlocks the entire Autonomous AI Agents Hub)
* **Limits:**
  * `MAX_STAFF_SEATS`: Unlimited (or high cap like 25)
  * `MAX_PATIENTS`: Unlimited
  * `MAX_PRACTITIONERS`: Unlimited (or high cap like 10)
  * `MAX_GBP_LOCATIONS`: 1 (Max supported by system architecture)
  * `MAX_TRACKED_KEYWORDS`: 50
  * `MAX_SCHEDULED_POSTS`: Unlimited
  * `AI_CREDITS_PER_MONTH`: Unlimited (or high cap like 2000 for autonomous agent background tasks)
* **Key Differentiator:** The AI AI Booking Assistant handles after-hours inquiries via WhatsApp, the Review Manager automatically replies to 5-star reviews, and Announcements/Automations are fully unlocked.

---

### Implementation Notes for Later:
When we are ready to implement this, we simply insert these 4 plans into the `Package` database table. The UI pages (like `/ai-agents` and `/whatsapp`) are already wrapped in `entitlementGuard`, so if a `STARTER` user tries to visit the WhatsApp Inbox, they will automatically be prompted to upgrade to `GROWTH`. If a `GROWTH` user tries to activate the AI Receptionist, they will be prompted to upgrade to `PREMIUM`.
