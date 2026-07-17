"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const bookingSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  serviceId: z.string().min(1, "Select a service"),
  date: z.date(),
  time: z.string().min(1, "Select a time"),
})

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00",
]

export function BookingForm({
  doctorId,
  services,
}: {
  doctorId: string
  services: { id: string; name: string; duration: number }[]
}) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: new Date(),
      time: "",
      serviceId: "",
    },
  })

  const selectedDate = watch("date")
  const selectedTime = watch("time")

  async function onSubmit(data: any) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, doctorId }),
      })
      if (res.ok) {
        toast({ title: "Appointment booked!", description: "Check your phone for confirmation." })
      } else {
        const err = await res.json()
        toast({ title: "Booking failed", description: err.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Appointment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input {...register("firstName")} placeholder="John" />
              {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message as string}</p>}
            </div>
            <div>
              <Label>Last Name</Label>
              <Input {...register("lastName")} placeholder="Doe" />
              {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message as string}</p>}
            </div>
          </div>

          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} placeholder="+1234567890" />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message as string}</p>}
          </div>

          <div>
            <Label>Email (optional)</Label>
            <Input {...register("email")} placeholder="john@example.com" />
          </div>

          <div>
            <Label>Service</Label>
            <Select onValueChange={(v) => setValue("serviceId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && <p className="text-red-500 text-xs">{errors.serviceId.message as string}</p>}
          </div>

          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue("date", date)}
                  disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                  />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-red-500 text-xs">{errors.date.message as string}</p>}
          </div>

          <div>
            <Label>Time</Label>
            <Select onValueChange={(v) => setValue("time", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time && <p className="text-red-500 text-xs">{errors.time.message as string}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Booking..." : "Confirm Booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}