"use client";

import { GyrexLogo } from "@/components/ui/GyrexLogo";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-slate-900 mb-4">Contact Us</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Have questions about Gyrex? Need technical support or help setting up your clinic? Our team is here to assist you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-slate-900">Get in Touch</h3>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Email Support</h4>
                <p className="text-sm text-slate-500 mt-1 mb-1">For general inquiries and technical assistance.</p>
                <a href="mailto:support@gyrex.in" className="text-blue-600 font-medium hover:underline">support@gyrex.in</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Sales & Partnerships</h4>
                <p className="text-sm text-slate-500 mt-1 mb-1">Speak directly with our sales team.</p>
                <a href="tel:+917838033664" className="text-blue-600 font-medium hover:underline">+91 7838033664</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Office Location</h4>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Gyrex Technologies<br />
                  D 89, 1st Floor, Chhatarpur Enclave<br />
                  Phase II, Delhi - 110068
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Send us a message</h3>
            <form className="space-y-4" action="mailto:hardiksiddhant@gmail.com" method="post" encType="text/plain">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Dr. Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="jane@clinic.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea rows={4} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="How can we help?"></textarea>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
      </main>

      <Footer />
    </div>
  );
}
