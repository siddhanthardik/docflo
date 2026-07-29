"use client";

import { useState, useEffect } from "react";
import { Check, X, Sparkles, ShieldCheck, Zap, CreditCard, ArrowRight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function BillingClient({ 
  currentPackage, 
  subscriptionStatus, 
  availablePackages,
  featureFlags,
  userCountry = "IN"
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
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [userCountry]);

  const handleSubscribe = async (pkg: any) => {
    setLoadingPkgId(pkg.id);
    const price = getPriceForPeriod(pkg);

    try {
      // 1-Click Free Plan or $0 Promo Code Activation
      if (price === 0) {
        const res = await fetch("/api/billing/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId: pkg.id, promoCode: promoCode ? promoCode.trim() : undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to activate plan");
        
        toast({ title: "Plan Activated! 🎉", description: `You have successfully switched to the ${pkg.name} plan.` });
        router.refresh();
        return;
      }

      // Paid Plan Checkout (Razorpay / Stripe)
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
          name: "Gyrex Clinic Platform",
          description: `Subscribe to ${pkg.name} (${period})`,
          image: "https://gyrex.in/logo.png",
          handler: function (response: any) {
            toast({ title: "Subscription Active! 🚀", description: `Your ${pkg.name} plan is now active.` });
            router.refresh();
          },
          theme: {
            color: "#4f46e5",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast({ title: "Payment Cancelled or Failed", description: response.error.description, variant: "destructive" });
        });
        rzp.open();
      }
    } catch (error: any) {
      toast({ title: "Checkout Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingPkgId(null);
    }
  };

  const getPriceForPeriod = (pkg: any) => {
    const priceModel = pkg.prices?.find((p: any) => p.countryCode === userCountry);
    if (!priceModel) return pkg.priceMonthly || 0;
    if (period === "monthly") return priceModel.priceMonthly;
    if (period === "quarterly") return priceModel.priceQuarterly;
    if (period === "yearly") return priceModel.priceYearly;
    return 0;
  };

  const getCurrency = (pkg: any) => {
    const priceModel = pkg.prices?.find((p: any) => p.countryCode === userCountry);
    return priceModel?.currency === "INR" || userCountry === "IN" ? "₹" : "$";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">

      {/* Pricing Controls & Period Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Available Subscription Plans</h3>
            <p className="text-xs text-gray-500 mt-1">Upgrade or modify your plan with 1-click self-managed checkout.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Promo Code Input */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="PROMO CODE"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full sm:w-44 px-3 py-2 border border-gray-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono font-bold uppercase tracking-wider text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>

            {/* Period Toggle */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl">
              {(["monthly", "quarterly", "yearly"] as const).map((p) => (
                <button 
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                    period === p 
                      ? 'bg-white shadow-xs text-gray-900' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {p === "yearly" ? "Yearly (-20%)" : p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {availablePackages.map((pkg) => {
            const isCurrent = currentPackage?.id === pkg.id;
            const price = getPriceForPeriod(pkg);
            const currency = getCurrency(pkg);
            const isPopular = pkg.name?.toUpperCase() === "GROWTH";

            return (
              <div 
                key={pkg.id} 
                className={`bg-white rounded-2xl border ${
                  isCurrent 
                    ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' 
                    : isPopular 
                    ? 'border-indigo-200 shadow-sm' 
                    : 'border-gray-200 shadow-2xs'
                } overflow-hidden flex flex-col justify-between relative transition-all hover:shadow-md group`}
              >
                {isCurrent && (
                  <div className="bg-indigo-600 text-white text-[11px] font-extrabold uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Current Active Plan
                  </div>
                )}

                {isPopular && !isCurrent && (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold uppercase tracking-widest text-center py-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Most Popular
                  </div>
                )}

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">{pkg.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 min-h-[32px] leading-relaxed">{pkg.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-3xl font-black text-gray-900">{currency}{price}</span>
                    <span className="text-xs font-semibold text-gray-500">/{period === 'monthly' ? 'mo' : period === 'quarterly' ? 'quarter' : 'yr'}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <ul className="space-y-2.5 text-xs text-gray-600">
                      {featureFlags.map(ff => {
                        const feat = pkg.packageFeatures?.find((pf: any) => pf.featureId === ff.id);
                        const isEnabled = feat?.isEnabled || false;
                        const limit = feat?.limit;

                        if (!isEnabled) {
                          return (
                            <li key={ff.id} className="flex items-center gap-2 text-gray-400">
                              <X className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                              <span className="line-through">{ff.name}</span>
                            </li>
                          );
                        }

                        return (
                          <li key={ff.id} className="flex items-center gap-2 font-medium text-gray-800">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {ff.name}
                              {ff.type === "NUMBER" && limit !== null && (
                                <span className="font-bold ml-1 text-[10px] uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                                  {limit === 0 ? "Unlimited" : limit}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
                  {isCurrent ? (
                    <Button 
                      variant="outline" 
                      className="w-full text-indigo-700 border-indigo-200 bg-indigo-50 font-bold text-xs cursor-default" 
                      disabled
                    >
                      Active Plan
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSubscribe(pkg)}
                      disabled={loadingPkgId === pkg.id}
                      className={`w-full font-bold text-xs shadow-sm transition-all ${
                        isPopular 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {loadingPkgId === pkg.id ? (
                        <><RefreshCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing...</>
                      ) : (
                        <><Zap className="h-3.5 w-3.5 mr-1.5" /> Upgrade to {pkg.name}</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
