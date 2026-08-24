"use client";

import { useState, useEffect } from "react";
import { Check, X, Star, ShieldCheck, Zap, CreditCard, ArrowRight, RefreshCcw, Bot } from "lucide-react";
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
  const [fetchingLink, setFetchingLink] = useState(false);

  const handleOpenRazorpayUpdateLink = async () => {
    try {
      setFetchingLink(true);
      const res = await fetch("/api/billing/razorpay/update-link");
      const data = await res.json();
      if (res.ok && data.updateUrl) {
        window.open(data.updateUrl, "_blank");
      } else {
        toast({
          title: "Payment Update",
          description: data.error || "Please select a plan below to renew your subscription.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load payment update link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFetchingLink(false);
    }
  };

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
    const targetPeriod = pkg._effectivePeriod || period;
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
          period: targetPeriod,
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

      {/* Payment Failed / Action Required Alert Banner */}
      {["PAST_DUE", "HALTED"].includes(subscriptionStatus) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-950">Subscription Renewal Payment Failed</h4>
              <p className="text-xs text-red-700 mt-0.5">
                Your automatic subscription renewal attempt failed. Please update your payment method on Razorpay to avoid service interruption.
              </p>
            </div>
          </div>
          <Button
            onClick={handleOpenRazorpayUpdateLink}
            disabled={fetchingLink}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shrink-0 shadow-md shadow-red-200"
          >
            {fetchingLink ? "Fetching Link..." : "💳 Update Payment Method →"}
          </Button>
        </div>
      )}

      {/* Pricing Controls & Period Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Available Subscription Plans</h3>
            <p className="text-xs text-gray-500 mt-1">Upgrade or modify your plan with 1-click self-managed checkout.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Toggle */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl">
              {(["monthly", "quarterly", "yearly"] as const).map((p) => (
                <button 
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                    period === p 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p === "monthly" ? "Monthly" : p === "quarterly" ? "Quarterly (10% OFF)" : "Yearly (20% OFF)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-6">
          {availablePackages.map((pkg) => {
            const isCurrent = currentPackage?.id === pkg.id;
            const currency = getCurrency(pkg);
            const isPopular = pkg.name?.toUpperCase().includes("GROWTH");
            const isStarter = pkg.name?.toUpperCase().includes("STARTER");
            const isAiReceptionist = pkg.name?.toUpperCase().includes("RECEPTIONIST") || pkg.slug === "ai-receptionist";
            const isFree = (pkg.priceMonthly || 0) === 0;

            const effectivePeriod = (isStarter && period === "monthly") ? "quarterly" : period;
            
            const priceModel = pkg.prices?.find((p: any) => p.countryCode === userCountry);
            const baseMonthly = priceModel?.priceMonthly || pkg.priceMonthly || 0;

            let realTotal = baseMonthly;
            let offeredTotal = baseMonthly;
            let discountPercent = 0;
            let effectiveMonthly = baseMonthly;

            if (effectivePeriod === "quarterly" && !isFree) {
              realTotal = baseMonthly * 3;
              offeredTotal = priceModel?.priceQuarterly > 0 ? priceModel.priceQuarterly : (pkg.priceQuarterly > 0 ? pkg.priceQuarterly : Math.round(realTotal * 0.90));
              discountPercent = 10;
              effectiveMonthly = Math.round(offeredTotal / 3);
            } else if (effectivePeriod === "yearly" && !isFree) {
              realTotal = baseMonthly * 12;
              offeredTotal = priceModel?.priceYearly > 0 ? priceModel.priceYearly : (pkg.priceYearly > 0 ? pkg.priceYearly : Math.round(realTotal * 0.80));
              discountPercent = 20;
              effectiveMonthly = Math.round(offeredTotal / 12);
            }

            return (
              <div 
                key={pkg.id} 
                className={`bg-white rounded-2xl border ${
                  isCurrent 
                    ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' 
                    : isPopular 
                    ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500/30' 
                    : isAiReceptionist
                    ? 'border-blue-400 shadow-sm ring-1 ring-blue-400/30'
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
                    <Star className="w-3.5 h-3.5 fill-current" /> Most Popular
                  </div>
                )}

                {isAiReceptionist && !isCurrent && !isPopular && (
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-[10px] font-extrabold uppercase tracking-widest text-center py-1 flex items-center justify-center gap-1">
                    <Bot className="w-3.5 h-3.5" /> 24/7 AI Receptionist
                  </div>
                )}

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                      {(pkg.name || "").replace(/\s*\/\s*AUTOPILOT/i, "").trim()}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 min-h-[32px] leading-relaxed">
                      {(pkg.description || "").toLowerCase().includes("fully automated") 
                        ? "Complete clinic management & growth platform" 
                        : pkg.description}
                    </p>
                  </div>

                  {/* Starter Plan Quarterly Commitment Requirement Notice */}
                  {isStarter && (
                    <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-2.5 text-[11px] text-indigo-950 font-medium leading-tight space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Quarterly Commitment Plan</span>
                      </div>
                      <p className="text-[10px] text-indigo-700">Requires a 3-Month (Quarterly) commitment for new clinics.</p>
                    </div>
                  )}

                  {/* Pricing Block with Struck-Through Real Price in Red and Offered Discount */}
                  <div className="pt-2">
                    {isFree ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-900">{currency}0</span>
                        <span className="text-xs font-semibold text-gray-500">/mo</span>
                      </div>
                    ) : discountPercent > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-extrabold line-through text-red-500 decoration-red-500">{currency}{baseMonthly}</span>
                          <span className="text-3xl font-black text-gray-900">{currency}{effectiveMonthly}</span>
                          <span className="text-xs font-semibold text-gray-500">/mo effective</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs flex-wrap pt-0.5">
                          <span className="text-gray-500 font-medium">Billed {effectivePeriod}:</span>
                          <span className="line-through text-red-500 decoration-red-500 font-bold text-[11px]">{currency}{realTotal}</span>
                          <span className="font-extrabold text-gray-900">{currency}{offeredTotal}</span>
                          <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                            SAVE {discountPercent}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-900">{currency}{baseMonthly}</span>
                        <span className="text-xs font-semibold text-gray-500">/mo</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">What&apos;s Included:</div>
                    
                    <ul className="space-y-2 text-xs text-slate-700">
                      {/* Render Included Modules */}
                      {pkg.modules && pkg.modules.length > 0 ? (
                        pkg.modules.map((m: any) => {
                          const mName = m.moduleName || m;
                          let label = mName;
                          if (mName === "CLINIC_CORE") label = "Clinic Operations (Patients, Billing, Calendar)";
                          if (mName === "GROWTH_SEO") label = "Growth & Local SEO (Google Profile & Rankings)";
                          if (mName === "WHATSAPP_CRM") label = "WhatsApp CRM (Automations & Reminders)";
                          if (mName === "AI_ASSISTANT") label = isAiReceptionist ? "24/7 WhatsApp AI Receptionist & Booking" : "AI Practice Assistant";

                          return (
                            <li key={mName} className="flex items-start gap-2 font-semibold text-slate-800">
                              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{label}</span>
                            </li>
                          );
                        })
                      ) : (
                        /* Human Tier Features Fallback */
                        (() => {
                          const pName = (pkg.name || "").toUpperCase();
                          if (pName.includes("FREE")) {
                            return (
                              <>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Standard Patient Records & Calendar</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> 1 Staff Seat & Basic Billing</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Up to 50 Patient Capacity</li>
                              </>
                            );
                          }
                          if (pName.includes("STARTER")) {
                            return (
                              <>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Everything in Free</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Google Business Profile & Local Search</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> 3 Staff Seats & 500 Patient Records</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> 90-Day Ranking Setup Support</li>
                              </>
                            );
                          }
                          if (pName.includes("RECEPTIONIST")) {
                            return (
                              <>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> 24/7 WhatsApp AI Receptionist & Booking</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Multilingual Support (Hindi, English, etc.)</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> OPD Calendar & Appointment Reminders</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> 3 Staff Seats & 2,000 Patient Records</li>
                              </>
                            );
                          }
                          if (pName.includes("GROWTH")) {
                            return (
                              <>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Everything in Starter</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> WhatsApp CRM & Automated Reminders</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> 10 Staff Seats & Unlimited Patients</li>
                                <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Tracked Local SEO Keywords</li>
                              </>
                            );
                          }
                          return (
                            <>
                              <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Everything in Growth</li>
                              <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> AI Practice Assistant & Auto Reviews</li>
                              <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Unlimited Staff Seats & Multi-Location</li>
                              <li className="flex items-center gap-2 font-medium text-slate-800"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Priority 24/7 Account Management</li>
                            </>
                          );
                        })()
                      )}

                      {/* Render Included Limits */}
                      {pkg.limits && pkg.limits.length > 0 && (
                        pkg.limits.map((l: any) => {
                          let val = l.limitValue === null || l.limitValue === undefined ? "Unlimited" : l.limitValue;
                          let name = l.limitName;
                          if (name === "MAX_STAFF_SEATS") name = "Staff Seats";
                          if (name === "MAX_PATIENTS") name = "Patient Capacity";
                          if (name === "MAX_PRACTITIONERS") {
                            name = "Doctor / Practitioner Seats";
                            if (l.limitValue === null || l.limitValue === undefined) {
                              val = "5 Included (FUP)";
                            }
                          }
                          if (name === "MAX_GBP_LOCATIONS") name = "Google Locations";
                          if (name === "MAX_TRACKED_KEYWORDS") name = "Tracked Keywords";
                          if (name === "MAX_SCHEDULED_POSTS") name = "Social Posts / mo";
                          if (name === "AI_CREDITS_PER_MONTH") name = "Smart Credits / mo";

                          return (
                            <li key={l.limitName} className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-600 font-medium">
                              <span>{name}</span>
                              <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded">{val}</span>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Action Footer Button */}
                <div className="p-5 border-t border-gray-100 bg-slate-50/60 mt-auto">
                  {isCurrent ? (
                    <Button 
                      variant="outline" 
                      className="w-full text-indigo-700 border-indigo-200 bg-indigo-50 font-bold text-xs cursor-default" 
                      disabled
                    >
                      ✓ Active Plan
                    </Button>
                  ) : (
                    (() => {
                      const PACKAGE_RANK: Record<string, number> = { "FREE": 1, "STARTER": 2, "GROWTH": 3, "PREMIUM": 4, "AUTOPILOT": 4 };
                      const getRank = (name: string) => {
                        const upper = (name || "").toUpperCase();
                        for (const [key, rank] of Object.entries(PACKAGE_RANK)) {
                          if (upper.includes(key)) return rank;
                        }
                        return 99;
                      };

                      const currentRank = getRank(currentPackage?.name || "");
                      const targetRank = getRank(pkg.name || "");
                      const cleanPkgName = (pkg.name || "").replace(/\s*\/\s*AUTOPILOT/i, "").trim();

                      let actionLabel = `Switch to ${cleanPkgName}`;
                      if (targetRank > currentRank) {
                        actionLabel = `Upgrade to ${cleanPkgName}`;
                      } else if (targetRank < currentRank) {
                        actionLabel = `Downgrade to ${cleanPkgName}`;
                      }

                      return (
                        <Button 
                          onClick={() => handleSubscribe({ ...pkg, _effectivePeriod: effectivePeriod })}
                          disabled={loadingPkgId === pkg.id}
                          className={`w-full font-bold text-xs shadow-sm transition-all ${
                            targetRank > currentRank
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                              : 'bg-slate-800 hover:bg-slate-900 text-white'
                          }`}
                        >
                          {loadingPkgId === pkg.id ? (
                            <><RefreshCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing...</>
                          ) : (
                            <><ArrowRight className="h-3.5 w-3.5 mr-1.5" /> {actionLabel}</>
                          )}
                        </Button>
                      );
                    })()
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
