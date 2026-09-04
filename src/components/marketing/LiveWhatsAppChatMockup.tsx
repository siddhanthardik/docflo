"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCheck, Phone, Video, MoreVertical, ArrowLeft, 
  MapPin, Calendar, Clock, CreditCard, Sparkles, Star, 
  Play, Pause, RotateCcw, Stethoscope, Building2, User, 
  Navigation, Globe, Bot, UserCheck, BellRing, MessageSquareText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatStep {
  id: string;
  sender: "patient" | "ai";
  senderLabel?: string;
  time: string;
  text?: string;
  isCard?: "confirmation" | "location" | "review" | "delegation-status";
  cardData?: any;
}

interface Scenario {
  id: string;
  name: string;
  badge: string;
  clinicName: string;
  doctorName: string;
  specialty: string;
  modeType?: "patient" | "doctor-delegation";
  steps: ChatStep[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "opd-booking",
    name: "In-Clinic OPD (Hinglish)",
    badge: "Patient Mode",
    clinicName: "City Health Clinic",
    doctorName: "Dr. Rajesh Sharma",
    specialty: "General Physician & Diabetologist",
    modeType: "patient",
    steps: [
      {
        id: "step-1",
        sender: "patient",
        time: "10:42 AM",
        text: "Namaste doctor saheb, mujhe kal shaam ko Dr. Sharma ke paas appointment chahiye. Fever & severe cough hai."
      },
      {
        id: "step-2",
        sender: "ai",
        time: "10:42 AM",
        text: "Namaste! 🙏 Dr. Rajesh Sharma (General Physician) kal shaam ko City Health Clinic par available hain.\n\n🕒 Available Timings: 05:00 PM – 08:30 PM\n💰 Consultation Fee: ₹800\n\nPatient ka full name aur preferred time share karein?"
      },
      {
        id: "step-3",
        sender: "patient",
        time: "10:43 AM",
        text: "06:45 PM theek rahega. Patient name: Rahul Verma (Age 32)"
      },
      {
        id: "step-4",
        sender: "ai",
        time: "10:43 AM",
        isCard: "confirmation",
        cardData: {
          status: "APPOINTMENT CONFIRMED",
          date: "Tomorrow, 06:45 PM",
          doctor: "Dr. Rajesh Sharma",
          specialty: "General Physician",
          clinic: "City Health Clinic",
          patient: "Rahul Verma (Age 32)",
          fee: "₹800 (Pay at Clinic)"
        }
      },
      {
        id: "step-5",
        sender: "ai",
        time: "10:43 AM",
        isCard: "location",
        cardData: {
          clinicName: "City Health Clinic",
          address: "Plot 42, Ring Road, South Extension-1, New Delhi",
          landmark: "Opposite Metro Pillar 148",
          mapsUrl: "https://maps.google.com"
        }
      },
      {
        id: "step-6",
        sender: "ai",
        time: "10:44 AM",
        text: "Aapka appointment schedule ho gaya hai 🙏 Visit se 2 ghante pehle aapko WhatsApp reminder mil jayega. Koi query ho toh aap yahan pooch sakte hain!"
      }
    ]
  },
  {
    id: "doctor-delegation",
    name: "Doctor Delegation (Staff Command)",
    badge: "Doctor ↔ AI",
    clinicName: "Riya • AI Clinic Assistant",
    doctorName: "Dr. Rajesh Sharma",
    specialty: "Internal Doctor Copilot & Delegation Mode",
    modeType: "doctor-delegation",
    steps: [
      {
        id: "step-d1",
        sender: "patient",
        senderLabel: "Dr. Rajesh Sharma (Owner)",
        time: "04:15 PM",
        text: "Riya, I'm held up in an emergency surgery. Please reschedule all patient appointments after 6 PM today to tomorrow evening and inform them on WhatsApp."
      },
      {
        id: "step-d2",
        sender: "ai",
        time: "04:15 PM",
        text: "Understood, Doctor. Rescheduling 3 evening consultations (Rahul Verma, Neha Gupta, Anil Sharma) to tomorrow after 5:00 PM and notifying patients via WhatsApp immediately."
      },
      {
        id: "step-d3",
        sender: "ai",
        time: "04:16 PM",
        isCard: "delegation-status",
        cardData: {
          task: "Emergency Reschedule Action",
          status: "ACTION EXECUTED",
          affected: "3 Patients Rescheduled & Notified",
          details: "Shifted to Tomorrow Evening (05:00 PM – 07:30 PM)",
          note: "WhatsApp notifications dispatched to all 3 patients."
        }
      },
      {
        id: "step-d4",
        sender: "patient",
        senderLabel: "Dr. Rajesh Sharma (Owner)",
        time: "04:17 PM",
        text: "Also send Mrs. Sunita Sharma that her fasting blood sugar report is normal and to continue current medicine."
      },
      {
        id: "step-d5",
        sender: "ai",
        time: "04:17 PM",
        text: "Message sent to Mrs. Sunita Sharma (+91 98112 XXXXX):\n\n'Namaste Mrs. Sharma, Dr. Rajesh Sharma has reviewed your blood sugar report. Results are completely normal. Please continue your current regimen as advised.'\n\nLogged in clinic audit trail, Doctor."
      }
    ]
  },
  {
    id: "timings-booking",
    name: "Doctor Inquiries (12+ Languages)",
    badge: "Multilingual",
    clinicName: "Aura Skin & Laser Clinic",
    doctorName: "Dr. Ananya Rao",
    specialty: "Consultant Dermatologist",
    modeType: "patient",
    steps: [
      {
        id: "step-v1",
        sender: "patient",
        time: "03:15 PM",
        text: "Hi! Can I book an appointment with Dermatologist Dr. Ananya today for a severe skin allergy?"
      },
      {
        id: "step-v2",
        sender: "ai",
        time: "03:15 PM",
        text: "Hello! 👋 Dr. Ananya Rao has consultation slots available at Aura Skin Clinic today:\n\n🕒 Evening OPD: 04:30 PM – 07:30 PM\n💰 Consultation Fee: ₹900\n\nWould you like to reserve a slot?"
      },
      {
        id: "step-v3",
        sender: "patient",
        time: "03:16 PM",
        text: "Yes please, 05:00 PM for Sunita Patel."
      },
      {
        id: "step-v4",
        sender: "ai",
        time: "03:16 PM",
        isCard: "confirmation",
        cardData: {
          status: "APPOINTMENT CONFIRMED",
          date: "Today, 05:00 PM",
          doctor: "Dr. Ananya Rao",
          specialty: "Consultant Dermatologist",
          clinic: "Aura Skin & Laser Clinic",
          patient: "Sunita Patel",
          fee: "₹900 (Pay at Clinic)"
        }
      },
      {
        id: "step-v5",
        sender: "ai",
        time: "03:16 PM",
        isCard: "location",
        cardData: {
          clinicName: "Aura Skin & Laser Clinic",
          address: "Shop 12, 1st Floor, Galleria Market, DLF Phase 4, Gurugram",
          landmark: "Near Central Plaza",
          mapsUrl: "https://maps.google.com"
        }
      }
    ]
  },
  {
    id: "review-autopilot",
    name: "5★ Google Review Autopilot",
    badge: "Reputation Engine",
    clinicName: "Apex Dental & Implant Studio",
    doctorName: "Dr. Rohan Kapoor",
    specialty: "Implantologist & Dentist",
    modeType: "patient",
    steps: [
      {
        id: "step-r1",
        sender: "ai",
        time: "02:30 PM",
        text: "Namaste Vikas ji! 🙏 Hope your consultation with Dr. Rohan Kapoor went comfortably today at Apex Dental. Your health is our top priority."
      },
      {
        id: "step-r2",
        sender: "ai",
        time: "02:30 PM",
        isCard: "review",
        cardData: {
          clinic: "Apex Dental & Implant Studio",
          stars: 5,
          ratingPrompt: "Could you take 10 seconds to share your experience on Google? It helps local patients discover trusted dental care."
        }
      },
      {
        id: "step-r3",
        sender: "patient",
        time: "02:34 PM",
        text: "Done! 5 stars given. Pain-free treatment, thank you Doctor saheb."
      },
      {
        id: "step-r4",
        sender: "ai",
        time: "02:34 PM",
        text: "Thank you so much Vikas ji! 🙏 Wishing you great oral health. Feel free to message here whenever you need to schedule your next visit."
      }
    ]
  }
];

export function LiveWhatsAppChatMockup() {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [visibleStepCount, setVisibleStepCount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const scenario = SCENARIOS[activeScenarioIdx];
  const totalSteps = scenario.steps.length;
  const isDoctorDelegation = scenario.modeType === "doctor-delegation";
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Reset steps when scenario changes
  useEffect(() => {
    setVisibleStepCount(1);
    setIsTyping(false);
  }, [activeScenarioIdx]);

  // Auto-play timer sequence
  useEffect(() => {
    if (!isPlaying) return;

    if (visibleStepCount >= totalSteps) {
      const resetTimer = setTimeout(() => {
        setVisibleStepCount(1);
      }, 7000);
      return () => clearTimeout(resetTimer);
    }

    // Show typing indicator before next message
    const typingTimer = setTimeout(() => {
      setIsTyping(true);
    }, 1200);

    const nextStepTimer = setTimeout(() => {
      setIsTyping(false);
      setVisibleStepCount((prev) => Math.min(prev + 1, totalSteps));
    }, 2400);

    return () => {
      clearTimeout(typingTimer);
      clearTimeout(nextStepTimer);
    };
  }, [visibleStepCount, totalSteps, isPlaying, activeScenarioIdx]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [visibleStepCount, isTyping]);

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 sm:px-6">
      {/* Header & Multilingual Banner */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Interactive Patient & Doctor Experience
        </Badge>
        
        <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Watch Gyrex AI Handle Patient Bookings & Doctor Delegation Live
        </h3>
        
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          From conversational slot booking in Hinglish to 1-click Google Maps directions, automated Google 5-star reviews, and direct WhatsApp task delegation from the doctor.
        </p>

        {/* 12+ Languages Pill */}
        <div className="pt-1 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 border border-indigo-200/80 px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            Fluently Speaks 12+ Languages: English, Hindi, Hinglish, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali, Punjabi & more
          </span>
        </div>

        {/* Scenario Pill Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
          {SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setActiveScenarioIdx(idx)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs",
                activeScenarioIdx === idx
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20 scale-[1.02]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span>{sc.name}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                activeScenarioIdx === idx ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {sc.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        
        {/* Left Side: Live Smartphone Frame (7 cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[340px] sm:max-w-[380px] bg-slate-900 rounded-[44px] p-3 shadow-2xl shadow-slate-900/40 border-4 border-slate-800 ring-1 ring-slate-700/50">
            
            {/* Top Dynamic Island / Speaker Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
            </div>

            {/* Inner Phone Screen */}
            <div className="relative w-full h-[600px] bg-[#EFEAE2] rounded-[34px] overflow-hidden flex flex-col font-sans border border-slate-300/40">
              
              {/* WhatsApp Header Bar */}
              <div className="bg-[#075E54] text-white px-3 py-2.5 pt-7 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-2 truncate">
                  <ArrowLeft className="w-4 h-4 text-white/90 shrink-0 cursor-pointer" />
                  
                  {/* Avatar */}
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-xs shadow-xs border",
                    isDoctorDelegation 
                      ? "bg-amber-500 text-slate-950 border-amber-300"
                      : "bg-white/20 text-white border-white/40"
                  )}>
                    {isDoctorDelegation ? <Bot className="w-5 h-5 text-slate-950" /> : scenario.clinicName.charAt(0)}
                  </div>
                  
                  {/* Name & Online Status */}
                  <div className="truncate text-left leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold truncate text-white">
                        {scenario.clinicName}
                      </span>
                      {/* Verified Green Badge */}
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[9px] font-black shrink-0">
                        ✓
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-200 block truncate">
                      {isTyping 
                        ? "typing..." 
                        : isDoctorDelegation 
                        ? "Doctor Copilot • Action Ready" 
                        : "Online • 24/7 AI Receptionist"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white/90 shrink-0 pr-1">
                  <Video className="w-4 h-4" />
                  <Phone className="w-4 h-4" />
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>

              {/* Chat Message Scrollable Viewport */}
              <div 
                ref={chatScrollRef}
                className="flex-1 p-3 overflow-y-auto space-y-2.5 scrollbar-none"
                style={{
                  backgroundImage: "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)",
                  backgroundSize: "16px 16px"
                }}
              >
                {/* Date Chip */}
                <div className="flex justify-center my-1">
                  <span className="bg-white/80 backdrop-blur-xs text-[10px] font-bold text-slate-600 px-2.5 py-0.5 rounded-md shadow-2xs border border-slate-200/60 uppercase">
                    {isDoctorDelegation ? "Internal Doctor Staff Line" : "Today"}
                  </span>
                </div>

                {/* Rendered Messages */}
                {scenario.steps.slice(0, visibleStepCount).map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "flex flex-col",
                      msg.sender === "patient" ? "items-end" : "items-start"
                    )}
                  >
                    {/* Optional Doctor Sender Label in Delegation Mode */}
                    {msg.sender === "patient" && msg.senderLabel && (
                      <span className="text-[9px] font-bold text-slate-500 mr-2 mb-0.5">
                        {msg.senderLabel}
                      </span>
                    )}

                    {/* Standard Text Bubble */}
                    {msg.text && (
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl p-2.5 px-3 shadow-xs text-xs leading-relaxed relative",
                          msg.sender === "patient"
                            ? "bg-[#D9FDD3] text-slate-900 rounded-tr-none"
                            : "bg-white text-slate-900 rounded-tl-none"
                        )}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                          <span>{msg.time}</span>
                          {msg.sender === "patient" && (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rich Confirmation Card (NO token, NO digital OPD slip) */}
                    {msg.isCard === "confirmation" && (
                      <div className="max-w-[92%] bg-white rounded-2xl border border-emerald-200 shadow-md p-3 space-y-2 text-left my-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            ✓ {msg.cardData.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">Gyrex WhatsApp</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{msg.cardData.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{msg.cardData.doctor} • <span className="text-slate-500 font-normal">{msg.cardData.specialty}</span></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{msg.cardData.clinic}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Patient: <strong className="text-slate-800">{msg.cardData.patient}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-emerald-700">{msg.cardData.fee}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rich Location Card */}
                    {msg.isCard === "location" && (
                      <div className="max-w-[92%] bg-white rounded-2xl border border-blue-200 shadow-md p-3 space-y-2 text-left my-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 truncate">{msg.cardData.clinicName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{msg.cardData.landmark}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {msg.cardData.address}
                        </p>
                        <div className="pt-1 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center justify-center gap-1 border border-blue-100">
                            <Navigation className="w-3 h-3" /> Turn-by-Turn Directions
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rich Review Card */}
                    {msg.isCard === "review" && (
                      <div className="max-w-[92%] bg-white rounded-2xl border border-amber-200 shadow-md p-3 space-y-2 text-left my-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{msg.cardData.clinic}</span>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {msg.cardData.ratingPrompt}
                        </p>
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-center font-bold text-xs text-amber-900">
                          ⭐⭐⭐⭐⭐ Rate 5 Stars on Google
                        </div>
                      </div>
                    )}

                    {/* Rich Doctor Delegation Card */}
                    {msg.isCard === "delegation-status" && (
                      <div className="max-w-[92%] bg-white rounded-2xl border border-indigo-200 shadow-md p-3 space-y-2 text-left my-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                            ✓ {msg.cardData.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">Backend Automation</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            {msg.cardData.affected}
                          </p>
                          <p className="text-slate-600 text-[11px]">
                            {msg.cardData.details}
                          </p>
                          <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            {msg.cardData.note}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start"
                  >
                    <div className="bg-white rounded-2xl rounded-tl-none p-2.5 px-4 shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Simulated WhatsApp Input Footer */}
              <div className="bg-[#F0F2F5] px-3 py-2 border-t border-slate-200/60 flex items-center gap-2 shrink-0">
                <div className="flex-1 bg-white rounded-full h-8 px-3 text-xs text-slate-400 flex items-center border border-slate-200/60 truncate">
                  {isDoctorDelegation ? "Delegate task to Riya..." : `Message ${scenario.clinicName}...`}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: All 5 Capabilities & Mode Differentiation (5 cols) */}
        <div className="lg:col-span-5 space-y-5 text-left">
          
          {/* Active Flow Indicator */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Current Sequence
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Step {visibleStepCount} of {totalSteps}
              </span>
            </div>
            <h4 className="text-base font-extrabold text-slate-900">
              {scenario.doctorName} • {scenario.clinicName}
            </h4>
            <p className="text-xs text-slate-500">
              {scenario.specialty}
            </p>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(visibleStepCount / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Patient Mode vs Doctor Delegation: Why the difference? */}
          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Two Specialized Operational Modes:</span>
            </div>
            <p className="text-[11px] text-indigo-950/80 leading-relaxed">
              <strong>Patient Mode:</strong> Courteous, warm, multilingual guide answering patient questions, quoting fees, and booking slots 24/7.
            </p>
            <p className="text-[11px] text-indigo-950/80 leading-relaxed">
              <strong>Doctor Delegation Mode:</strong> Direct, concise executive copilot. The doctor can text simple instructions (mass rescheduling, notifying patients, report updates) and the AI executes backend actions in seconds.
            </p>
          </div>

          {/* ALL 5 Core Built Capabilities */}
          <div className="space-y-2.5">
            
            {/* 1. Conversational OPD Booking */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-black text-xs">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Conversational OPD Booking</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  24/7 slot inquiry with doctor timings and consultation fee quotation in 12+ Indian and global languages.
                </p>
              </div>
            </div>

            {/* 2. Clean Appointment Confirmation */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 shrink-0 font-black text-xs">
                2
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Clean Appointment Confirmation</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Instant card sharing Doctor, Specialty, Clinic, Patient Name, Date & Time, and Consultation Fee without false EMR claims.
                </p>
              </div>
            </div>

            {/* 3. Google Maps Location Sharing */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 font-black text-xs">
                3
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Google Maps Location Sharing</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  1-click turn-by-turn navigation card and landmark directions so patients arrive punctually without calling reception.
                </p>
              </div>
            </div>

            {/* 4. Automated Visit Reminder Notice */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 font-black text-xs">
                4
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Automated Visit Reminder Notice</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Pre-visit reminder notification via WhatsApp to eliminate clinic no-shows and prepare patients before their slot.
                </p>
              </div>
            </div>

            {/* 5. Google 5-Star Review Autopilot */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-black text-xs">
                5
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Google 5-Star Review Autopilot</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Automated review collection on your Google Business Profile after visits to dominate the local Google Maps 3-Pack.
                </p>
              </div>
            </div>

          </div>

          {/* Animation Controls & CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-xs h-10 px-3 rounded-xl border-slate-300 gap-1.5 flex-1 sm:flex-initial"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVisibleStepCount(1);
                  setIsPlaying(true);
                }}
                className="text-xs h-10 px-3 rounded-xl border-slate-300 gap-1.5 flex-1 sm:flex-initial"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </Button>
            </div>

            <Link href="/ai-receptionist-demo" className="w-full sm:flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-emerald-600/20">
                Try Live Simulator
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
