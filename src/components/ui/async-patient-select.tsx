"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2, Search, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { PatientForm } from "@/components/patients/patient-form";
import { useToast } from "@/components/ui/use-toast";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string | null;
  patientType?: string;
}

interface AsyncPatientSelectProps {
  value: string; // The selected patient ID
  onValueChange: (value: string) => void;
  onPatientChange?: (patient: Patient | null) => void;
  placeholder?: string;
  className?: string;
  initialPatients?: Patient[]; // Fallback list if network is slow initially
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function AsyncPatientSelect({
  value,
  onValueChange,
  onPatientChange,
  placeholder = "Select patient...",
  className,
  initialPatients = [],
}: AsyncPatientSelectProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [results, setResults] = useState<Patient[]>(initialPatients);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    initialPatients.find((p) => p.id === value) || null
  );

  // If initialPatients change and we don't have a selected patient yet, try to find it
  useEffect(() => {
    if (value && !selectedPatient && initialPatients.length > 0) {
      const match = initialPatients.find(p => p.id === value);
      if (match) setSelectedPatient(match);
    }
  }, [initialPatients, value, selectedPatient]);

  // If the value prop changes externally (e.g. form reset), clear selection if value is empty
  useEffect(() => {
    if (!value) {
      setSelectedPatient(null);
    }
  }, [value]);

  useEffect(() => {
    let active = true;

    const fetchPatients = async () => {
      if (!open) return; // Only fetch when popover is open
      
      setLoading(true);
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(debouncedSearch)}&limit=15`);
        if (!res.ok) throw new Error("Failed to fetch patients");
        const data = await res.json();
        
        if (active) {
          setResults(data.patients || []);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        // Fallback to initial if search fails completely
        if (active) setResults(initialPatients);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPatients();

    return () => {
      active = false;
    };
  }, [debouncedSearch, open]);

  // To display DOB nicely if it exists
  const getAgeOrDobStr = (dobString?: string | null) => {
    if (!dobString) return "";
    const date = new Date(dobString);
    if (isNaN(date.getTime())) return "";
    
    // Calculate age
    const ageDifMs = Date.now() - date.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${age}yo`;
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !selectedPatient && "text-muted-foreground",
              className
            )}
          >
            {selectedPatient ? (
              <span className="truncate">
                {selectedPatient.firstName} {selectedPatient.lastName} 
                <span className="text-gray-400 ml-1">({selectedPatient.phone})</span>
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {loading && <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50 text-indigo-600" />}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto p-1">
            {results.length === 0 && !loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No patients found.
              </div>
            )}
            
            {results.map((patient) => {
              const ageStr = getAgeOrDobStr(patient.dateOfBirth);
              
              return (
                <div
                  key={patient.id}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    value === patient.id ? "bg-indigo-50/50" : ""
                  )}
                  onClick={() => {
                    onValueChange(patient.id);
                    onPatientChange?.(patient);
                    setSelectedPatient(patient);
                    setOpen(false);
                    setSearchQuery(""); // reset search
                  }}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </span>
                      {ageStr && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          {ageStr}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 truncate">
                      {patient.phone}
                    </span>
                  </div>
                  
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 text-indigo-600 shrink-0",
                      value === patient.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              );
            })}
          </div>
          
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => {
                setOpen(false);
                setShowPatientModal(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Register New Patient
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <PatientForm
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
        mode="create"
        onSubmit={async (data) => {
          const res = await fetch("/api/patients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            const err = await res.json();
            toast({ title: "Error", description: err.error || "Failed to create patient", variant: "destructive" });
            throw new Error(err.error);
          }

          const newPatient = await res.json();
          toast({ title: "Success", description: "Patient registered successfully" });
          
          // Select the newly created patient
          onValueChange(newPatient.id);
          onPatientChange?.(newPatient);
          setSelectedPatient(newPatient);
          
          // Optionally add to results so it shows up immediately in the dropdown list
          setResults((prev) => [newPatient, ...prev]);
        }}
      />
    </>
  );
}
