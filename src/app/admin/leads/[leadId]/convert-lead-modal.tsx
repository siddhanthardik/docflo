"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertToCustomer } from "../convert-actions";
import { toast } from "sonner";
import { Loader2, Copy, Check } from "lucide-react";

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  packages: any[];
}

export function ConvertLeadModal({ isOpen, onClose, lead, packages }: ConvertLeadModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{email: string, password: string} | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!selectedPackage) {
      toast.error("Please select a subscription package");
      return;
    }

    setIsLoading(true);
    try {
      const res = await convertToCustomer(lead.id, selectedPackage, password || undefined);
      
      if (res.success) {
        toast.success("Lead successfully converted to Customer!");
        setResult({
          email: res.email ?? '',
          password: res.temporaryPassword ?? ''
        });
      } else {
        toast.error(res.error || "Failed to convert lead");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!result) return;
    const text = `Welcome to DocFlo!\nLogin URL: https://docflo.com/login\nEmail: ${result.email}\nPassword: ${result.password}\n\nPlease change your password upon logging in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (result) {
      // If we successfully converted, refresh the page to show new state
      window.location.reload();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convert to Customer</DialogTitle>
          <DialogDescription>
            Provision a new DocFlo account for {lead.name || lead.clinicName}.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Lead Email</Label>
              <Input value={lead.email || "No email provided"} disabled className="bg-slate-50" />
              {!lead.email && <p className="text-xs text-amber-600">A temporary email will be generated.</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Subscription Package *</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} (${pkg.priceMonthly}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input 
                type="text" 
                placeholder="Leave blank to auto-generate" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-slate-500">Provide this to the customer so they can log in.</p>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-200 text-sm">
              <h4 className="font-semibold mb-2">Account Provisioned Successfully!</h4>
              <p>Share these credentials with the customer:</p>
            </div>
            
            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium">{result.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Password:</span>
                <span className="font-medium font-mono">{result.password}</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleCopyCredentials}
            >
              {copied ? <><Check className="w-4 h-4 mr-2" /> Copied</> : <><Copy className="w-4 h-4 mr-2" /> Copy Credentials</>}
            </Button>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
              <Button onClick={handleConvert} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Convert Lead
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
