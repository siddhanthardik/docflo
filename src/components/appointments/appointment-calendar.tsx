"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Clock, User, Phone, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Appointment {
  id: string;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  status: "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => Promise<void>;
}

export function AppointmentCalendar({
  appointments,
  selectedDate,
  onDateSelect,
  onStatusChange,
  onEdit,
  onDelete,
}: AppointmentCalendarProps) {
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-700";
      case "CHECKED_IN":
        return "bg-sky-100 text-sky-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "NO_SHOW":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const selectedDateAppointments = appointments.filter((apt) => {
    if (!selectedDate) return false;
    const aptDate = new Date(apt.date);
    return (
      aptDate.getDate() === selectedDate.getDate() &&
      aptDate.getMonth() === selectedDate.getMonth() &&
      aptDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Get dates that have appointments
  const appointmentDates = appointments.map((apt) => {
    const date = new Date(apt.date);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      <Card>
        <CardContent className="pt-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            className="rounded-md border"
            modifiers={{
              hasAppointment: appointmentDates,
            }}
            modifiersStyles={{
              hasAppointment: {
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                fontWeight: "bold",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "Select a date"}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedDateAppointments.length} appointment
              {selectedDateAppointments.length !== 1 ? "s" : ""}
            </p>
          </div>

          {selectedDateAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {selectedDate
                  ? "No appointments for this date"
                  : "Select a date to view appointments"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatTime(appointment.startTime)} -{" "}
                        {formatTime(appointment.endTime)}
                      </div>
                      <Badge
                        className={getStatusColor(appointment.status)}
                      >
                        {appointment.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {appointment.patient.firstName}{" "}
                        {appointment.patient.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-3 w-3" />
                      {appointment.patient.phone}
                    </div>
                    {appointment.reason && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Reason:</span>{" "}
                        {appointment.reason}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(appointment.status === "CONFIRMED" || appointment.status === "CHECKED_IN") && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange(appointment.id, "COMPLETED")
                            }
                          >
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange(appointment.id, "NO_SHOW")
                            }
                          >
                            Mark as No Show
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange(appointment.id, "CANCELLED")
                            }
                          >
                            Cancel Appointment
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(appointment)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(appointment.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}