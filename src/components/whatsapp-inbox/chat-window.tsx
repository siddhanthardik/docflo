"use client"

import { useState, useRef, useEffect } from "react"
import { Send, MessageSquare, Phone, ArrowLeft, ChevronDown } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"

function getChatDateDivider(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "d MMMM yyyy")
}

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
  onBack,
}: {
  conversation: Conversation | null
  messages: Message[]
  onSendMessage: (content: string) => Promise<void>
  onUpdatePatientStatus?: (type: string) => void
  onBack?: () => void
}) {
  const [newMsg, setNewMsg] = useState("")
  const [sending, setSending] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const activeConversationIdRef = useRef<string | null>(null)
  const isNearBottomRef = useRef(true)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      })
    }
  }

  const handleScroll = () => {
    const container = chatContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const isNear = distanceFromBottom <= 120
    isNearBottomRef.current = isNear
    setShowScrollBottom(!isNear)
  }

  useEffect(() => {
    const isNewConv = activeConversationIdRef.current !== conversation?.id
    if (isNewConv) {
      activeConversationIdRef.current = conversation?.id || null
      isNearBottomRef.current = true
      setShowScrollBottom(false)
      requestAnimationFrame(() => {
        scrollToBottom("auto")
      })
      return
    }

    // Only auto-scroll down if user was already near the bottom
    // Do not pull down if user is reading previous messages
    if (isNearBottomRef.current) {
      scrollToBottom("smooth")
    }
  }, [conversation?.id, messages])

  const handleSend = async () => {
    const text = newMsg.trim()
    if (!text) return
    setSending(true)
    setNewMsg("")
    await onSendMessage(text)
    setSending(false)
    isNearBottomRef.current = true
    setShowScrollBottom(false)
    setTimeout(() => scrollToBottom("smooth"), 50)
  }

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
        <MessageSquare className="w-12 h-12 text-gray-200" />
        <p className="text-sm font-medium text-gray-500">Select a conversation</p>
        <p className="text-xs text-gray-400">Choose a conversation from the list to start chatting</p>
      </div>
    )
  }

  const name = conversation.patientName || conversation.patientPhone

  return (
    <div className="h-full flex flex-col relative">
      {/* Chat Header */}
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
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
              {name.toLowerCase().includes("doctor") ? (
                <span className="bg-purple-50 text-purple-700 border border-purple-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Doctor
                </span>
              ) : name.toLowerCase().includes("staff") ? (
                <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Staff
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Patient
                </span>
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
      <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-gray-400">No messages yet. Start the conversation below.</p>
          </div>
        )}
        {messages.map((msg, index) => {
          const isOut = msg.direction === "OUTGOING"
          const currentMsgDate = format(new Date(msg.createdAt), "yyyy-MM-dd")
          const prevMsgDate = index > 0 ? format(new Date(messages[index - 1].createdAt), "yyyy-MM-dd") : null
          const showDateDivider = currentMsgDate !== prevMsgDate

          return (
            <div key={msg.id} className="space-y-3">
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <span className="bg-white/95 text-slate-500 border border-slate-200/80 shadow-xs px-3 py-1 rounded-lg text-xs font-semibold tracking-wide">
                    {getChatDateDivider(msg.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1.5 ${
                      isOut ? "text-indigo-200 text-right" : "text-gray-400"
                    }`}
                  >
                    {format(new Date(msg.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => {
            isNearBottomRef.current = true
            setShowScrollBottom(false)
            scrollToBottom("smooth")
          }}
          className="absolute bottom-24 right-6 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 shadow-md p-2 rounded-full transition-all flex items-center justify-center group z-20 cursor-pointer"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 transition-colors" />
        </button>
      )}

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