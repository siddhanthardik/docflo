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

**Critical Rule**: Do not introduce Meta Cloud API support in any future implementation unless explicitly requested.
<!-- END:whatsapp-module-rules -->
