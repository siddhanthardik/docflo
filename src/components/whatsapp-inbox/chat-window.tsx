"use client"

import { useState, useRef, useEffect } from "react"
import { Send, MessageSquare, Phone } from "lucide-react"
import { format } from "date-fns"

interface Message {
  id: string
  direction: string
  content: string
  senderName?: string
  createdAt: string
}

interface Conversation {
  id: string
  patientName?: string
  patientPhone: string
  status: string
  patient?: { patientType?: string }
}

export function ChatWindow({
  conversation,
  messages,
  onSendMessage,
  onUpdatePatientStatus,
}: {
  conversation: Conversation | null
  messages: Message[]
  onSendMessage: (content: string) => Promise<void>
  onUpdatePatientStatus?: (type: string) => void
}) {
  const [newMsg, setNewMsg] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const text = newMsg.trim()
    if (!text) return
    setSending(true)
    setNewMsg("")
    await onSendMessage(text)
    setSending(false)
  }

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
        <MessageSquare className="w-12 h-12 text-gray-200" />
        <p className="text-sm font-medium text-gray-500">Select a conversation</p>
        <p className="text-xs text-gray-400">Choose a conversation from the sidebar to start chatting</p>
      </div>
    )
  }

  const name = conversation.patientName || conversation.patientPhone

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 flex-shrink-0">
            {name
              .split(" ")
              .map((w: string) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
              {conversation.patient && (
                <select
                  value={conversation.patient.patientType || "LEAD"}
                  onChange={(e) => onUpdatePatientStatus?.(e.target.value)}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border-0 cursor-pointer focus:ring-0 ${
                    conversation.patient.patientType === "LEAD" ? "bg-purple-100 text-purple-700" :
                    conversation.patient.patientType === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                    conversation.patient.patientType === "INACTIVE" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}
                >
                  <option value="LEAD" className="text-gray-900 bg-white">LEAD</option>
                  <option value="ACTIVE" className="text-gray-900 bg-white">ACTIVE</option>
                  <option value="INACTIVE" className="text-gray-900 bg-white">INACTIVE</option>
                  <option value="LOST" className="text-gray-900 bg-white">LOST</option>
                </select>
              )}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  conversation.status === "OPEN" ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              {conversation.status === "OPEN" ? "Chat Active" : conversation.status.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`tel:${conversation.patientPhone}`}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Call patient"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-gray-400">No messages yet. Start the conversation below.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOut = msg.direction === "OUTGOING"
          return (
            <div
              key={msg.id}
              className={`flex ${isOut ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[72%] px-4 py-2.5 shadow-sm ${
                  isOut
                    ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100"
                }`}
              >
                {msg.senderName && !isOut && (
                  <p className="text-xs font-semibold text-indigo-600 mb-0.5">{msg.senderName}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p
                  className={`text-xs mt-1.5 ${
                    isOut ? "text-indigo-200 text-right" : "text-gray-400"
                  }`}
                >
                  {format(new Date(msg.createdAt), "h:mm a")}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            id="chat-message-input"
            placeholder="Type a message…"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            rows={1}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none max-h-32"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            id="send-message-btn"
            onClick={handleSend}
            disabled={!newMsg.trim() || sending}
            className="flex-shrink-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Press <kbd className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 text-xs">Enter</kbd> to send · <kbd className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 text-xs">Shift+Enter</kbd> for newline
        </p>
      </div>
    </div>
  )
}