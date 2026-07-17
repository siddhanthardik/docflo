"use client";

import { useState, useEffect } from "react";
import { Check, CreditCard, Shield, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const PLANS = [
  {
    name: "FREE",
    price: "$0",
    interval: "forever",
    description: "For new clinics getting started",
    features: [
      "Basic Profile Management",
      "No Local SEO Tracking",
      "Limited Reports",
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline",
    popular: false,
    keywordsLimit: 0,
  },
  {
    name: "STARTER",
    price: "$29",
    interval: "/month",
    description: "Grow your local presence",
    features: [
      "Track up to 5 Local SEO Keywords",
      "Geo-Grid Tracking",
      "Review Management",
      "Basic Appointment Scheduling",
    ],
    buttonText: "Upgrade to Starter",
    buttonVariant: "default",
    popular: false,
    keywordsLimit: 5,
  },
  {
    name: "GROWTH",
    price: "$99",
    interval: "/month",
    description: "Dominate your local market",
    features: [
      "Track up to 20 Local SEO Keywords",
      "Advanced Geo-Grid Analysis",
      "WhatsApp Integration",
      "Automated Campaigns",
      "Priority Support",
    ],
    buttonText: "Upgrade to Growth",
    buttonVariant: "default",
    popular: true,
    keywordsLimit: 20,
  },
  {
    name: "ENTERPRISE",
    price: "$299",
    interval: "/month",
    description: "For multi-location practices",
    features: [
      "Unlimited Local SEO Keywords",
      "Unlimited Geo-Grid Tracking",
      "Custom Integrations",
      "Dedicated Account Manager",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline",
    popular: false,
    keywordsLimit: "Unlimited",
  },
];

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/settings/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (planName === profile?.subscriptionPlan) return;
    
    setUpgrading(true);
    // Simulate an upgrade flow (in reality, this would redirect to Stripe Checkout)
    setTimeout(() => {
      setProfile({ ...profile, subscriptionPlan: planName });
      toast({ title: "Success", description: `You have been upgraded to the ${planName} plan!` });
      setUpgrading(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const currentPlan = profile?.subscriptionPlan || "FREE";

  return (
    <div className="min-h-screen pb-12">
      <div className="mb-8 max-w-4xl mx-auto text-center pt-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl mb-4">
          Upgrade your local presence
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Choose the right plan for your practice to track keywords, generate reviews, and dominate Google search.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div 
              key={plan.name} 
              className={`bg-white rounded-2xl border ${plan.popular ? 'border-indigo-600 shadow-xl ring-1 ring-indigo-600' : 'border-gray-200 shadow-sm'} p-6 relative flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 h-10">{plan.description}</p>
                <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
                  {plan.price}
                  <span className="ml-1 text-xl font-medium text-gray-500">{plan.interval}</span>
                </div>
              </div>
              
              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-indigo-600 shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button 
                variant={currentPlan === plan.name ? "outline" : (plan.buttonVariant as any)}
                className={`w-full ${currentPlan === plan.name ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : plan.popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                disabled={currentPlan === plan.name || upgrading}
                onClick={() => handleUpgrade(plan.name)}
              >
                {currentPlan === plan.name ? (
                  <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Current Plan</span>
                ) : (
                  upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.buttonText
                )}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 max-w-3xl mx-auto bg-gray-50 rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enterprise Security & Compliance</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                All plans include enterprise-grade security and full HIPAA compliance. Your patient data is encrypted at rest and in transit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
