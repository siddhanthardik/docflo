"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

export function useConversations() {
  const { toast } = useToast()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/inbox/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  return { conversations, loading, refetch: fetchConversations }
}

export function useConversation(id: string) {
  const { toast } = useToast()
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])

  const fetchConversation = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/inbox/conversations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setConversation(data)
        setMessages(data.messages || [])
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }, [id, toast])

  useEffect(() => {
    fetchConversation()
    const interval = setInterval(fetchConversation, 5000)
    return () => clearInterval(interval)
  }, [fetchConversation])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return
    try {
      const res = await fetch(`/api/inbox/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const newMsg = await res.json()
        setMessages(prev => [...prev, newMsg])
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const assignToStaff = async (staffId: string) => {
    // similar
  }

  const updateStatus = async (status: string) => {
    // similar
  }

  const updatePatientStatus = useCallback(async (type: string) => {
    if (!conversation?.patient?.id) return
    try {
      const res = await fetch(`/api/patients/${conversation.patient.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientType: type })
      })
      if (!res.ok) throw new Error("Failed to update status")
      toast({ title: "Success", description: "Patient status updated" })
      setConversation((prev: any) => ({
        ...prev,
        patient: { ...prev.patient, patientType: type }
      }))
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }, [conversation, toast])

  return { conversation, messages, sendMessage, assignToStaff, updateStatus, updatePatientStatus, refetch: fetchConversation }
}