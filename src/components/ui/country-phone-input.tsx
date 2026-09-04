"use client";

import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import { COUNTRIES, getCountryFlag, getDefaultCountryCodeForTimezone } from "@/lib/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Phone, ChevronDown, Search, Check } from "lucide-react";

export interface CountryPhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  timezone?: string | null;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CountryPhoneInput({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  timezone,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  id = "phone",
}: CountryPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize with timezone default if countryCode is empty
  useEffect(() => {
    if (!countryCode) {
      const defaultCode = getDefaultCountryCodeForTimezone(timezone);
      onCountryCodeChange(defaultCode);
    }
  }, [countryCode, timezone, onCountryCodeChange]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [open]);

  // Find active country item
  const selectedCountry = useMemo(() => {
    return (
      COUNTRIES.find((c) => c.dialCode === countryCode) ||
      COUNTRIES.find((c) => c.code === "IN") ||
      COUNTRIES[0]
    );
  }, [countryCode]);

  // Filter countries by search query (name or dialCode or ISO code)
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const flag = useMemo(() => getCountryFlag(selectedCountry.code), [selectedCountry.code]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Country Code Trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex items-center justify-between gap-1.5 h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shrink-0 select-none shadow-xs"
            aria-label="Select Country Code"
          >
            <span className="text-base leading-none">{flag}</span>
            <span className="tabular-nums font-bold tracking-tight text-slate-700">
              {countryCode || selectedCountry.dialCode}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-80" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[300px] sm:w-[320px] p-0 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden"
        >
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                No countries found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.dialCode === countryCode;
                const cFlag = getCountryFlag(c.code);
                return (
                  <button
                    key={`${c.code}-${c.dialCode}`}
                    type="button"
                    onClick={() => {
                      onCountryCodeChange(c.dialCode);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-left ${
                      isSelected
                        ? "bg-indigo-50/80 text-indigo-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-base shrink-0 leading-none">{cFlag}</span>
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono shrink-0">
                        {c.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-xs font-semibold tabular-nums text-slate-600">
                        {c.dialCode}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* National Phone Number Input */}
      <div className="relative flex-1">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          id={id}
          type="tel"
          disabled={disabled}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder={
            placeholder ||
            (countryCode === "+91" ? "98765 43210 (10 digits)" : "Mobile number")
          }
          required={required}
          className="pl-9 h-10 text-sm font-medium text-slate-900 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
