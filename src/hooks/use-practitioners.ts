import { useState, useEffect } from "react";
import { toast } from "sonner";

export function usePractitioners() {
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPractitioners() {
      try {
        const response = await fetch("/api/practitioners");
        if (!response.ok) throw new Error("Failed to fetch practitioners");
        const data = await response.json();
        setPractitioners(data);
      } catch (error: any) {
        toast.error(error.message || "Failed to load practitioners");
      } finally {
        setLoading(false);
      }
    }
    fetchPractitioners();
  }, []);

  return { practitioners, loading };
}
