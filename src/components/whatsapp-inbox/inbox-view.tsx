"use client"

import { useState } from "react"
import { ConversationList } from "./conversation-list"
import { ChatWindow } from "./chat-window"
import { PatientContext } from "./patient-context"
import { useConversations, useConversation } from "@/hooks/use-inbox"

export function InboxView() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { conversations, loading } = useConversations()
  const { conversation, messages, sendMessage, assignToStaff, updateStatus, updatePatientStatus } = useConversation(selectedId || "")

  return (
    <div className="flex h-[calc(100vh-13rem)] bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-100">
        <ConversationList
          conversations={conversations}
          loading={loading}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-w-0">
        <ChatWindow
          conversation={conversation}
          messages={messages}
          onSendMessage={sendMessage}
          onUpdatePatientStatus={updatePatientStatus}
        />
      </div>

      {/* Patient Context Panel */}
      {conversation?.patient && (
        <div className="w-72 flex-shrink-0 border-l border-gray-100 overflow-y-auto">
          <PatientContext patient={conversation.patient} />
        </div>
      )}
    </div>
  )
}