"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface GoogleTimePickerProps {
  value?: string; // 24-hr format "HH:mm", e.g. "09:00", "17:30"
  onChange: (value: string) => void;
  minTime?: string; // optional minimum time
  stepMinutes?: 15 | 30;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// Helper: Convert 24-hr "HH:mm" to 12-hr "hh:mm A"
export function formatTo12Hour(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24 || "";
  const parts = time24.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  if (isNaN(hours)) return time24;

  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  const formattedHours = String(hours12).padStart(2, "0");
  return `${formattedHours}:${minutes} ${ampm}`;
}

// Generate standard clinical day time slots (from 06:00 to 23:30)
function generateTimeOptions(stepMinutes: number = 15): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      const hStr = String(hour).padStart(2, "0");
      const mStr = String(minute).padStart(2, "0");
      const time24 = `${hStr}:${mStr}`;
      options.push({
        value: time24,
        label: formatTo12Hour(time24),
      });
    }
  }
  return options;
}

export function GoogleTimePicker({
  value,
  onChange,
  minTime,
  stepMinutes = 15,
  disabled = false,
  className,
  placeholder = "Select time",
}: GoogleTimePickerProps) {
  const options = React.useMemo(() => generateTimeOptions(stepMinutes), [stepMinutes]);

  // Ensure currently selected value is present even if not in standard 15-min steps
  const allOptions = React.useMemo(() => {
    if (value && !options.some((opt) => opt.value === value)) {
      const customOpt = { value, label: formatTo12Hour(value) };
      return [...options, customOpt].sort((a, b) => a.value.localeCompare(b.value));
    }
    return options;
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (!minTime) return allOptions;
    return allOptions.filter((opt) => opt.value >= minTime);
  }, [allOptions, minTime]);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-10 text-xs sm:text-sm font-medium rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <SelectValue placeholder={placeholder}>
              {value ? formatTo12Hour(value) : placeholder}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-60 rounded-xl border-slate-200 shadow-xl overflow-y-auto">
          {filteredOptions.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-xs sm:text-sm font-medium cursor-pointer py-2 focus:bg-indigo-50 focus:text-indigo-700"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
