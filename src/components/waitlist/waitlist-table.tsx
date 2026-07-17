"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

export function WaitlistTable({ data }: { data: any[] }) {
  const { toast } = useToast()
  const [entries, setEntries] = useState(data)

  async function notify(entryId: string) {
    try {
      await fetch(`/api/waitlist/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      })
      toast({ title: "Notification sent" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Requested Service</TableHead>
          <TableHead>Preferred Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
              No patients on waitlist
            </TableCell>
          </TableRow>
        ) : (
          entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.patientName}</TableCell>
              <TableCell>{entry.patientPhone}</TableCell>
              <TableCell>{entry.serviceType || "-"}</TableCell>
              <TableCell>
                {entry.preferredDate ? formatDate(new Date(entry.preferredDate)) : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={entry.status === "WAITING" ? "secondary" : "outline"}>
                  {entry.status}
                </Badge>
              </TableCell>
              <TableCell>
                {entry.status === "WAITING" && (
                  <Button size="sm" onClick={() => notify(entry.id)}>
                    Notify
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}