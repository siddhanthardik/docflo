"use client"

import { toast as sonnerToast } from "sonner"
import type { ReactNode } from "react"

type ToastProps = {
  title?: ReactNode
  description?: ReactNode
  variant?: "default" | "destructive"
}

export function toast({ title, description, variant = "default" }: ToastProps) {
  const message = title ?? description
  const options = title && description ? { description } : undefined

  if (variant === "destructive") {
    return sonnerToast.error(message, options)
  }

  return sonnerToast(message, options)
}

export function useToast() {
  return { toast }
}
