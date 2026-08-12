"use client";

import { useState } from "react";
import { Database, HardDrive, Mail, CheckCircle2, RefreshCcw, ExternalLink, ShieldCheck, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function BackupControlPanel() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [lastBackup, setLastBackup] = useState<any>(null);

  const triggerBackup = async () => {
    try {
      setRunning(true);
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Backup failed");

      setLastBackup(data.result);
      toast({
        title: "Backup Complete! 🎉",
        description: `Uploaded to Google Drive & confirmation email sent (${(data.result.fileSizeBytes / 1024).toFixed(1)} KB).`,
      });
    } catch (error: any) {
      toast({
        title: "Backup Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Automated Daily (02:00 UTC)
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-indigo-600" /> Google Drive Database Backup Engine
          </h3>
          <p className="text-xs text-gray-500 max-w-xl">
            Automatically exports full encrypted database snapshots, stores them on Google Drive with a 30-day retention policy, and dispatches a daily confirmation email.
          </p>
        </div>

        <Button
          onClick={triggerBackup}
          disabled={running}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 px-5 rounded-xl shadow-sm shrink-0"
        >
          {running ? (
            <><RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> Exporting & Uploading...</>
          ) : (
            <><Play className="h-4 w-4 mr-2 text-amber-300" /> Run Instant Backup Now</>
          )}
        </Button>
      </div>

      {/* Connection & Configuration Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <HardDrive className="h-4 w-4 text-blue-500" /> Storage Destination
          </div>
          <p className="text-sm font-bold text-gray-900">Google Drive API v3</p>
          <p className="text-[11px] text-gray-500 truncate">Folder: Gyrex Backups</p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Mail className="h-4 w-4 text-emerald-500" /> Daily Email Alert
          </div>
          <p className="text-sm font-bold text-gray-900">Resend Email API</p>
          <p className="text-[11px] text-gray-500">Status: Active Notifications</p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Database className="h-4 w-4 text-purple-500" /> Auto Retention
          </div>
          <p className="text-sm font-bold text-gray-900">30-Day Auto Pruning</p>
          <p className="text-[11px] text-gray-500">Cleans up old backups</p>
        </div>
      </div>

      {/* Last Executed Backup Result */}
      {lastBackup && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Backup Successfully Created & Stored
            </div>
            {lastBackup.driveLink && (
              <a 
                href={lastBackup.driveLink} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 underline"
              >
                Open in Google Drive <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-emerald-100">
            <div>
              <span className="text-gray-400 block font-semibold text-[10px] uppercase">File Name</span>
              <span className="font-mono font-bold text-gray-800 text-[11px] truncate block">{lastBackup.fileName}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold text-[10px] uppercase">Size</span>
              <span className="font-bold text-gray-800">{(lastBackup.fileSizeBytes / 1024).toFixed(1)} KB</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold text-[10px] uppercase">Records Exported</span>
              <span className="font-bold text-emerald-700">{Object.values(lastBackup.recordCounts as Record<string, number>).reduce((a, b) => a + b, 0)} records</span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold text-[10px] uppercase">Email Alert</span>
              <span className="font-bold text-emerald-600">{lastBackup.emailSent ? "Sent ✅" : "Logged"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
