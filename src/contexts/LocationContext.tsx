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
  refresh: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/gbp/profiles");
      const data = await res.json();
      if (data && data.connected) {
        setConnected(true);
        if (Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
          
          const savedLocationId = localStorage.getItem("gyrex_active_location");
          if (savedLocationId && data.accounts.some((p: GbpAccount) => p.id === savedLocationId)) {
            setActiveLocationId(savedLocationId);
          } else if (data.accounts.length > 0 && !activeLocationId) {
            setActiveLocationId(data.accounts[0].id);
          }

          // Automatically sync Google Profile and Local SEO in the background on login/session start
          // Rate-limited to once per 15 minutes per browser session
          if (typeof window !== "undefined") {
            const lastAutoSync = sessionStorage.getItem("gyrex_last_auto_sync");
            const shouldAutoSync = !lastAutoSync || (Date.now() - Number(lastAutoSync)) > 15 * 60 * 1000;
            if (shouldAutoSync) {
              sessionStorage.setItem("gyrex_last_auto_sync", Date.now().toString());
              fetch("/api/local-seo/sync", { method: "POST" })
                .then(async (syncRes) => {
                  if (syncRes.ok) {
                    window.dispatchEvent(new CustomEvent("gyrex:gbp-synced"));
                  }
                })
                .catch((err) => console.warn("[AutoSync] Background sync failed:", err));
            }
          }
        }
      } else {
        setConnected(false);
        setAccounts([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available locations for the user
  useEffect(() => {
    fetchLocations();
  }, []);

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
        refresh: fetchLocations,
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
