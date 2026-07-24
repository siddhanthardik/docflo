"use client";

import { useState, useEffect } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function BillingClient({ 
  currentPackage, 
  subscriptionStatus, 
  availablePackages,
  featureFlags,
  userCountry = "IN" // Default to IN for razorpay, others will use Stripe
}: { 
  currentPackage: any; 
  subscriptionStatus: string; 
  availablePackages: any[]; 
  featureFlags: any[];
  userCountry?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [loadingPkgId, setLoadingPkgId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [promoCode, setPromoCode] = useState("");
  
  useEffect(() => {
    if (userCountry === "IN") {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [userCountry]);

  const handleSubscribe = async (pkg: any) => {
    setLoadingPkgId(pkg.id);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          packageId: pkg.id, 
          countryCode: userCountry,
          period,
          promoCode: promoCode ? promoCode.trim() : undefined
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");
      
      if (data.provider === "stripe") {
        window.location.href = data.url; // Redirect to Stripe Checkout
        return;
      }

      if (data.provider === "razorpay") {
        const options = {
          key: data.keyId,
          subscription_id: data.subscriptionId,
          name: "Gyrex",
          description: `Subscribe to ${pkg.name}`,
          image: "https://gyrex.in/logo.png",
          handler: function (response: any) {
            toast({ title: "Subscription Active", description: "Your subscription has been successfully activated!" });
            router.refresh();
          },
          prefill: {
            name: "Gyrex User",
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
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingPkgId(null);
    }
  };

  const getPriceForPeriod = (pkg: any) => {
    const priceModel = pkg.prices?.find((p: any) => p.countryCode === userCountry);
    if (!priceModel) return 0;
    if (period === "monthly") return priceModel.priceMonthly;
    if (period === "quarterly") return priceModel.priceQuarterly;
    if (period === "yearly") return priceModel.priceYearly;
    return 0;
  };

  const getCurrency = (pkg: any) => {
    const priceModel = pkg.prices?.find((p: any) => p.countryCode === userCountry);
    return priceModel?.currency === "INR" ? "₹" : "$";
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
              <Button onClick={() => window.location.href = "/subscription"} variant="outline" size="sm">Manage Billing</Button>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-lg font-bold text-gray-900">Upgrade Your Plan</h2>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter Promo Code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-48 pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase font-mono"
              />
            </div>
            <div className="inline-flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setPeriod("monthly")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${period === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setPeriod("quarterly")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${period === 'quarterly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Quarterly
              </button>
              <button 
                onClick={() => setPeriod("yearly")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${period === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {availablePackages.map((pkg) => {
            const isCurrent = currentPackage?.id === pkg.id;
            const price = getPriceForPeriod(pkg);
            const currency = getCurrency(pkg);
            
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
                    <span className="text-4xl font-extrabold text-gray-900">{currency}{price}</span>
                    <span className="text-sm font-medium text-gray-500">/{period === 'monthly' ? 'mo' : period === 'quarterly' ? 'quarter' : 'yr'}</span>
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
                        disabled={loadingPkgId === pkg.id || price === 0}
                      >
                        {loadingPkgId === pkg.id ? "Processing..." : (price === 0 ? "Contact Sales" : "Upgrade")}
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
