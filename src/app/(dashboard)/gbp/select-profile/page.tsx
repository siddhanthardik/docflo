"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Store, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLocationContext } from "@/contexts/LocationContext";

interface DiscoveredLocation {
  name: string;
  title: string;
  address: string;
  accountName: string;
}

export default function SelectProfilePage() {
  const [locations, setLocations] = useState<DiscoveredLocation[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  // We need to trigger a reload of locations in context after saving
  const { setActiveLocationId } = useLocationContext();

  useEffect(() => {
    fetch("/api/gbp/discover-locations")
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setLocations(data.locations || []);
          // Do NOT auto-select all by default to prevent accidental syncing
          setSelectedLocations([]);
        }
      })
      .catch(err => {
        console.error(err);
        setError("Failed to discover locations. Please try connecting again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSelection = (name: string) => {
    setSelectedLocations(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const handleSave = async () => {
    if (selectedLocations.length === 0) {
      toast({
        title: "No profiles selected",
        description: "Please select at least one Google Business Profile to connect.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/gbp/save-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedLocations }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success!",
        description: "Your selected Google Business Profiles have been connected.",
      });
      
      // Force reload to get the new locations in context
      window.location.href = "/gbp";
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to connect profiles.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500">Discovering your Google Business Profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Authentication Error</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            {error}
            <div className="mt-4">
              <Button onClick={() => router.push("/gbp")} variant="outline" className="border-red-200 hover:bg-red-100">
                Return to GBP Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Select Profiles to Connect</h1>
        <p className="text-gray-500 mt-2">
          We found {locations.length} location{locations.length !== 1 ? 's' : ''} in your Google account. Select the ones you want to manage in Docflo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {locations.map((loc) => (
          <Card 
            key={loc.name} 
            className={`cursor-pointer transition-all hover:border-primary/50 ${selectedLocations.includes(loc.name) ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => toggleSelection(loc.name)}
          >
            <CardHeader className="flex flex-row items-start space-y-0 pb-2">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  {loc.title}
                </CardTitle>
                <CardDescription className="mt-1 flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {loc.address}
                </CardDescription>
              </div>
              <Checkbox 
                checked={selectedLocations.includes(loc.name)} 
                onCheckedChange={() => toggleSelection(loc.name)}
                className="ml-4"
              />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md inline-block">
                Account: {loc.accountName}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-4 border-t pt-6">
        <Button variant="outline" onClick={() => router.push("/gbp")} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || selectedLocations.length === 0} className="min-w-[150px]">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</>
          ) : (
            `Connect ${selectedLocations.length} Profile${selectedLocations.length !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </div>
  );
}
