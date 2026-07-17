import { InboxView } from "@/components/whatsapp-inbox/inbox-view"

export default function WhatsAppInboxPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">WhatsApp Inbox</h1>
        <p className="text-gray-500 mt-1">Manage patient conversations in real‑time</p>
      </div>
      <InboxView />
    </div>
  )
}