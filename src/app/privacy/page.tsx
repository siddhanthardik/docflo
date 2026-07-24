import { GyrexLogo } from "@/components/ui/GyrexLogo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-black text-slate-900 mb-6">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-slate-600 leading-relaxed">
            <p>
              At Gyrex, we are committed to protecting your privacy and ensuring the security of the information you provide to us. This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your information.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us when you create an account, such as your name, email address, clinic details, and payment information. We also automatically collect certain information when you use our services, including log data, device information, and usage statistics.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h3>
            <p>
              We use the collected information to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, maintain, and improve our services.</li>
              <li>Process transactions and send related information.</li>
              <li>Send technical notices, updates, security alerts, and support messages.</li>
              <li>Respond to your comments, questions, and requests.</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Data Security</h3>
            <p>
              We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Patient Data (HIPAA/GDPR Compliance)</h3>
            <p>
              As a healthcare software provider, we act as a Data Processor for the patient information you enter into Gyrex. You remain the Data Controller. We process this data strictly in accordance with applicable healthcare privacy regulations.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@gyrex.com.
            </p>
          </div>
        </article>
      </div>
      </main>

      <Footer />
    </div>
  );
}
