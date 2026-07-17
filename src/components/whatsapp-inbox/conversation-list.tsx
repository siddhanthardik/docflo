"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Conversation {
  id: string
  patientName?: string
  patientPhone: string
  status: string
  lastMessageAt: string
  unreadCount: number
  messages: { content: string; direction: string }[]
}

export function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [query, setQuery] = useState("")

  const filtered = conversations.filter((c) => {
    const name = (c.patientName || c.patientPhone).toLowerCase()
    return name.includes(query.toLowerCase())
  })

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  const avatarColors = [
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ]

  function getAvatarColor(id: string) {
    const idx = id.charCodeAt(0) % avatarColors.length
    return avatarColors[idx]
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Conversations
          {conversations.length > 0 && (
            <span className="ml-2 bg-indigo-50 text-indigo-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          )}
        </h3>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            id="conversation-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-gray-50 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Search className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-500">No conversations found</p>
            </div>
          )
          : filtered.map((conv) => {
              const name = conv.patientName || conv.patientPhone
              const lastMsg = conv.messages?.[0]?.content || "No messages yet"
              const isSelected = selectedId === conv.id
              return (
                <button
                  key={conv.id}
                  id={`conv-${conv.id}`}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors flex items-center gap-3 group ${
                    isSelected
                      ? "bg-indigo-50 border-l-2 border-l-indigo-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold ${getAvatarColor(conv.id)}`}
                  >
                    {getInitials(name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-sm font-medium truncate ${
                          isSelected ? "text-indigo-700" : "text-gray-900"
                        }`}
                      >
                        {name}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-gray-500 truncate">{lastMsg}</p>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 bg-indigo-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
      </div>
    </div>
  )
}