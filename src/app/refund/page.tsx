import { GyrexLogo } from "@/components/ui/GyrexLogo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-black text-slate-900 mb-6">Refund Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-slate-600 leading-relaxed">
            <p>
              At Gyrex, we are committed to providing exceptional software and services to healthcare professionals. Our refund policy is designed to be fair and transparent.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Monthly Subscriptions</h3>
            <p>
              If you cancel your monthly subscription, your cancellation will take effect at the end of the current billing cycle. You will continue to have access to the service through the end of your billing period. We do not provide refunds or credits for partial-month subscription periods.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Annual Subscriptions</h3>
            <p>
              For annual subscription plans, we offer a 14-day money-back guarantee. If you are not satisfied with our service within the first 14 days of your initial purchase, you may request a full refund. After 14 days, annual subscriptions are non-refundable.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Implementation Fees</h3>
            <p>
              Any one-time setup, onboarding, or implementation fees are non-refundable once the onboarding process has commenced, as these fees cover the dedicated time and resources of our implementation specialists.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Requesting a Refund</h3>
            <p>
              To request a refund within an eligible period, please contact our billing team at billing@gyrex.com with your account details and reason for cancellation. Refunds will be processed to the original payment method within 5-10 business days.
            </p>
          </div>
        </article>
      </div>
      </main>

      <Footer />
    </div>
  );
}
