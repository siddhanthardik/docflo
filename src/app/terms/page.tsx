import { GyrexLogo } from "@/components/ui/GyrexLogo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-black text-slate-900 mb-6">Terms & Conditions</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-slate-600 leading-relaxed">
            <p>
              Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using the Gyrex platform operated by Gyrex Technologies.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h3>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Subscriptions</h3>
            <p>
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis (monthly or annually) depending on your selected plan.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Accounts</h3>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Intellectual Property</h3>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of Gyrex Technologies and its licensors.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Limitation of Liability</h3>
            <p>
              In no event shall Gyrex Technologies be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">6. Practitioner Licensing & Professional Compliance</h3>
            <p>
              By creating an account, the User (Doctor or Clinic) represents and warrants that they, and any practitioners operating under their account, hold all valid, unexpired licenses, registrations, and permits required by applicable local, state, and national laws to practice medicine and operate a clinical facility.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">7. SaaS Platform & Medical Disclaimer</h3>
            <p>
              Gyrex is an administrative software-as-a-service (SaaS) management platform. Gyrex does not provide medical services, verify practitioner qualifications, or engage in patient referral services. The User remains solely responsible for all clinical care, treatment, and medical compliance.
            </p>
          </div>
        </article>
      </div>
      </main>

      <Footer />
    </div>
  );
}
