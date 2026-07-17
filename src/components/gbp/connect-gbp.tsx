"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/ui/icons";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface ConnectGBPProps {
  onConnect: () => Promise<void>;
  connected: boolean;
  loading: boolean;
}

export function ConnectGBP({ onConnect, connected, loading }: ConnectGBPProps) {
  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Google Business Profile
          {connected && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </CardTitle>
        <CardDescription>
          Connect your Google Business Profile to track performance and manage reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <GoogleIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium mb-2">Connect Your Profile</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Link your Google Business Profile to start tracking views, searches, and managing reviews from one place
            </p>
            <Button onClick={onConnect} disabled={loading} size="lg">
              <GoogleIcon className="h-4 w-4 mr-2" />
              Connect Google Business Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-green-700 mb-2">
              Profile Connected
            </h3>
            <p className="text-gray-500">
              Your Google Business Profile is connected and syncing data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}