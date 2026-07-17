"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface GbpAccount {
  id: string;
  locationName: string;
  locationId: string | null;
}

interface LocationContextType {
  activeLocationId: string | null;
  setActiveLocationId: (id: string | null) => void;
  locations: GbpAccount[];
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [locations, setLocations] = useState<GbpAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available locations for the user
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/gbp/profiles")
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.profiles)) {
            setLocations(data.profiles);
            
            // Try to load saved preference from localStorage
            const savedLocationId = localStorage.getItem("docflo_active_location");
            if (savedLocationId && data.profiles.some((p: GbpAccount) => p.id === savedLocationId)) {
              setActiveLocationId(savedLocationId);
            } else if (data.profiles.length > 0) {
              // Auto-select first if none saved
              setActiveLocationId(data.profiles[0].id);
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      setLocations([]);
      setActiveLocationId(null);
    }
  }, [status]);

  // Save to localStorage and cookie when changed
  useEffect(() => {
    if (activeLocationId) {
      localStorage.setItem("docflo_active_location", activeLocationId);
      // Set a cookie so Server Components and API routes can read it
      document.cookie = `activeLocationId=${activeLocationId}; path=/; max-age=31536000`;
    }
  }, [activeLocationId]);

  return (
    <LocationContext.Provider
      value={{
        activeLocationId,
        setActiveLocationId,
        locations,
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
