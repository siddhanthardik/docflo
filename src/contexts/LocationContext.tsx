"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { GbpAccount } from "@/types/gbp";

export type { GbpAccount };


interface LocationContextType {
  connected: boolean;
  accounts: GbpAccount[];
  activeLocation: GbpAccount | null;
  activeLocationId: string | null;
  setActiveLocationId: (id: string | null) => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available locations for the user
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/gbp/profiles")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.connected) {
            setConnected(true);
            if (Array.isArray(data.accounts)) {
              setAccounts(data.accounts);
              
              // Try to load saved preference from localStorage
              const savedLocationId = localStorage.getItem("gyrex_active_location");
              if (savedLocationId && data.accounts.some((p: GbpAccount) => p.id === savedLocationId)) {
                setActiveLocationId(savedLocationId);
              } else if (data.accounts.length > 0) {
                // Auto-select first if none saved
                setActiveLocationId(data.accounts[0].id);
              }
            }
          } else {
            setConnected(false);
            setAccounts([]);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      setConnected(false);
      setAccounts([]);
      setActiveLocationId(null);
    }
  }, [status]);

  // Save to localStorage and cookie when changed
  useEffect(() => {
    if (activeLocationId) {
      localStorage.setItem("gyrex_active_location", activeLocationId);
      // Set a cookie so Server Components and API routes can read it
      document.cookie = `activeLocationId=${activeLocationId}; path=/; max-age=31536000`;
    }
  }, [activeLocationId]);

  const activeLocation = accounts.find((a) => a.id === activeLocationId) || null;

  return (
    <LocationContext.Provider
      value={{
        connected,
        accounts,
        activeLocation,
        activeLocationId,
        setActiveLocationId,
        isLoading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}
