"use client";

import { useState, useEffect } from "react";
import { Check, X, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function BillingClient({ 
  currentPackage, 
  subscriptionStatus, 
  availablePackages,
  featureFlags
}: { 
  currentPackage: any; 
  subscriptionStatus: string; 
  availablePackages: any[]; 
  featureFlags: any[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [loadingPkgId, setLoadingPkgId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  
  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (pkg: any) => {
    setLoadingPkgId(pkg.id);
    try {
      // Create order
      const res = await fetch("/api/billing/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, promoCode: promoCode || undefined }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");
      
      if (data.isFree) {
        toast({ title: "Success", description: "Successfully subscribed to Free plan!" });
        router.refresh();
        setLoadingPkgId(null);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Docflo",
        description: `Upgrade to ${pkg.name}`,
        image: "https://via.placeholder.com/150", // replace with actual logo
        order_id: data.orderId,
        handler: async function (response: any) {
          // Verify payment
          try {
            const verifyRes = await fetch("/api/billing/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id,
                promoCode: data.promoCode || undefined, // from the create order response
              }),
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              toast({ title: "Payment Successful", description: "Your subscription has been upgraded!" });
              router.refresh();
            } else {
              toast({ title: "Payment Failed", description: "Could not verify payment.", variant: "destructive" });
            }
          } catch (e) {
             toast({ title: "Error", description: "An error occurred during verification.", variant: "destructive" });
          }
        },
        prefill: {
          name: "Docflo User",
          email: "user@example.com",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" });
      });
      rzp.open();
      
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingPkgId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Plan Overview */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Current Plan</h2>
        {currentPackage ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-indigo-900">{currentPackage.name}</span>
                {subscriptionStatus === "ACTIVE" ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">Active</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider">{subscriptionStatus}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                You are currently on the {currentPackage.name} plan.
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <div className="text-2xl font-bold text-gray-900">${currentPackage.priceMonthly}<span className="text-sm text-gray-500 font-medium">/mo</span></div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
            You are not currently subscribed to any plan.
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-bold text-gray-900">Upgrade Your Plan</h2>
          <div className="flex items-center gap-2 max-w-sm w-full">
            <input 
              type="text" 
              placeholder="Promo Code (Optional)" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {availablePackages.map((pkg) => {
            const isCurrent = currentPackage?.id === pkg.id;
            const features = pkg.features as any || {};
            
            return (
              <div key={pkg.id} className={`bg-white rounded-2xl border ${isCurrent ? 'border-indigo-500 shadow-indigo-100/50 ring-1 ring-indigo-500' : 'border-gray-100'} shadow-sm overflow-hidden flex flex-col relative transition-all hover:shadow-md`}>
                {isCurrent && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
                )}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  {pkg.name === "GROWTH" && (
                     <div className="mb-2 flex items-center gap-1 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                       <Sparkles className="h-3 w-3" /> Most Popular
                     </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{pkg.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 h-10">{pkg.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">${pkg.priceMonthly}</span>
                    <span className="text-sm font-medium text-gray-500">/mo</span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1 text-sm text-gray-600">
                    {featureFlags.map(ff => {
                      const feat = pkg.packageFeatures?.find((pf: any) => pf.featureId === ff.id);
                      const isEnabled = feat?.isEnabled || false;
                      const limit = feat?.limit;
                      
                      if (!isEnabled) {
                         return (
                           <li key={ff.id} className="flex items-center gap-2">
                             <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                             <span className="text-gray-400">{ff.name}</span>
                           </li>
                         );
                      }

                      return (
                        <li key={ff.id} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span>
                            {ff.name}
                            {ff.type === "NUMBER" && limit !== null && (
                              <span className="font-bold ml-1 text-xs uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {limit === 0 ? "Unlimited" : limit}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  
                  <div className="mt-auto">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-50 cursor-default" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleSubscribe(pkg)}
                        className={`w-full ${pkg.name === "GROWTH" ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                        disabled={loadingPkgId === pkg.id}
                      >
                        {loadingPkgId === pkg.id ? "Processing..." : (pkg.priceMonthly === 0 ? "Get Started" : "Upgrade")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
