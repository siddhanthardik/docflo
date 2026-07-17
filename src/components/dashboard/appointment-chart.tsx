"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"

interface Appointment {
  date: string
}

export function AppointmentChart({ data }: { data: Appointment[] }) {
  const grouped = data.reduce((acc: Record<string, number>, apt) => {
    const day = format(new Date(apt.date), "MMM dd")
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(grouped).map(([name, count]) => ({ name, appointments: count }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
