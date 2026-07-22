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
    <div className="flex h-[calc(100vh-12rem)] md:h-[calc(100vh-13rem)] bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Conversation Sidebar List */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-100 ${selectedId ? "hidden md:block" : "block"}`}>
        <ConversationList
          conversations={conversations}
          loading={loading}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 min-w-0 ${selectedId ? "block" : "hidden md:block"}`}>
        <ChatWindow
          conversation={conversation}
          messages={messages}
          onSendMessage={sendMessage}
          onUpdatePatientStatus={updatePatientStatus}
          onBack={() => setSelectedId(null)}
        />
      </div>

      {/* Patient Context Panel (Desktop view) */}
      {conversation?.patient && (
        <div className="hidden lg:block w-72 flex-shrink-0 border-l border-gray-100 overflow-y-auto">
          <PatientContext patient={conversation.patient} />
        </div>
      )}
    </div>
  )
}