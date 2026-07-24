import { GyrexLogo } from "@/components/ui/GyrexLogo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-black text-slate-900 mb-6">Disclaimer</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-slate-600 leading-relaxed">
            <p>
              The information provided by Gyrex Technologies on our website and through our software services is for general informational and administrative purposes only.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Not Medical Advice</h3>
            <p>
              Gyrex is a software platform designed to assist healthcare professionals with marketing, reputation management, and patient administration. It is not intended to provide medical advice, diagnosis, or treatment. We do not practice medicine or provide medical services.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Results Not Guaranteed</h3>
            <p>
              While we strive to improve your clinic's local search rankings, review volume, and patient acquisition metrics, we cannot guarantee specific results. Performance metrics depend on various external factors including Google's algorithm changes, local market competition, and individual clinic implementation.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Third-Party Platforms</h3>
            <p>
              Our services integrate with third-party platforms such as Google Business Profile and WhatsApp. We are not responsible for the uptime, policies, or changes implemented by these third-party services which may affect our software's functionality.
            </p>
          </div>
        </article>
      </div>
      </main>

      <Footer />
    </div>
  );
}
