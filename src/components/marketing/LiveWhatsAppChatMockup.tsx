"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCheck, Phone, Video, MoreVertical, ArrowLeft, 
  MapPin, Calendar, Clock, CreditCard, Sparkles, Star, 
  Play, Pause, RotateCcw, ExternalLink, ShieldCheck, ChevronRight,
  Stethoscope, Building2, User, FileText, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatStep {
  id: string;
  sender: "patient" | "ai";
  time: string;
  text?: string;
  isCard?: "confirmation" | "location" | "receipt" | "teleconsult" | "review";
  cardData?: any;
}

interface Scenario {
  id: string;
  name: string;
  badge: string;
  clinicName: string;
  doctorName: string;
  specialty: string;
  steps: ChatStep[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "opd-booking",
    name: "In-Clinic OPD (Hinglish)",
    badge: "Most Popular",
    clinicName: "City Health Clinic",
    doctorName: "Dr. Rajesh Sharma",
    specialty: "General Physician & Diabetologist",
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
        text: "Namaste! 🙏 Yes, Dr. Rajesh Sharma (General Physician) has 2 OPD slots available tomorrow evening at City Health Clinic:\n\n1️⃣ 05:30 PM\n2️⃣ 06:45 PM\n\nConsultation Fee: ₹800\nWhich slot works best for you?"
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
          token: "Token #07",
          status: "CONFIRMED",
          date: "Tomorrow, 06:45 PM",
          doctor: "Dr. Rajesh Sharma, MD",
          patient: "Rahul Verma (32/M)",
          mode: "In-Clinic OPD",
          fee: "₹800 (Pay at Counter / UPI)"
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
        time: "10:43 AM",
        isCard: "receipt",
        cardData: {
          tokenNo: "OPD-8492",
          fee: "₹800",
          reminder: "Auto-reminder will be sent 2 hours before your slot with queue status."
        }
      }
    ]
  },
  {
    id: "video-consult",
    name: "Video Consultation",
    badge: "Telehealth",
    clinicName: "Aura Skin & Laser Studio",
    doctorName: "Dr. Ananya Rao",
    specialty: "Consultant Dermatologist",
    steps: [
      {
        id: "step-v1",
        sender: "patient",
        time: "03:15 PM",
        text: "Hi! Can I book an urgent video consultation with Dermatologist Dr. Ananya today for severe skin allergy?"
      },
      {
        id: "step-v2",
        sender: "ai",
        time: "03:15 PM",
        text: "Hello! 👋 Dr. Ananya Rao has a teleconsultation slot open today at 04:30 PM.\n\nVideo Fee: ₹1,100 (Includes HD Google Meet link & digital prescription).\nWould you like to confirm this?"
      },
      {
        id: "step-v3",
        sender: "patient",
        time: "03:16 PM",
        text: "Yes please, confirm for Sunita Patel."
      },
      {
        id: "step-v4",
        sender: "ai",
        time: "03:16 AM",
        isCard: "teleconsult",
        cardData: {
          meetLink: "https://meet.google.com/gyx-tele-care",
          slot: "Today, 04:30 PM",
          patient: "Sunita Patel",
          doctor: "Dr. Ananya Rao (Dermatology)",
          upiId: "cityclinic@icici"
        }
      }
    ]
  },
  {
    id: "review-autopilot",
    name: "5★ Google Review",
    badge: "Reputation Engine",
    clinicName: "Apex Dental & Implant Studio",
    doctorName: "Dr. Rohan Kapoor",
    specialty: "Implantologist & Dentist",
    steps: [
      {
        id: "step-r1",
        sender: "ai",
        time: "02:30 PM",
        text: "Namaste Vikas ji! 🙏 Hope your root canal treatment with Dr. Rohan Kapoor went comfortably today. Your smile is our top priority."
      },
      {
        id: "step-r2",
        sender: "ai",
        time: "02:30 PM",
        isCard: "review",
        cardData: {
          clinic: "Apex Dental Studio",
          stars: 5,
          ratingPrompt: "Could you take 10 seconds to share your experience on Google? It helps local patients find verified dental care."
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
        text: "Thank you so much Vikas ji! 🙏 Wishing you a fast recovery. Feel free to message here anytime if you need your digital prescription or medicines."
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
    <div className="w-full max-w-5xl mx-auto py-10 px-4">
      {/* Header & Scenario Switcher */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/80 px-3 py-1 text-xs font-bold uppercase tracking-wider">
          Interactive Patient Experience
        </Badge>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Watch Gyrex AI Handle Patient Bookings Live
        </h3>
        <p className="text-xs sm:text-sm text-slate-600">
          From first greeting in Hinglish to instant slot booking, Google Maps directions, and 5-star review collection.
        </p>

        {/* Scenario Pill Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setActiveScenarioIdx(idx)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs",
                activeScenarioIdx === idx
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Live Smartphone Frame (7 cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[340px] sm:max-w-[370px] bg-slate-900 rounded-[44px] p-3 shadow-2xl shadow-slate-900/40 border-4 border-slate-800 ring-1 ring-slate-700/50">
            
            {/* Top Dynamic Island / Speaker Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
            </div>

            {/* Inner Phone Screen */}
            <div className="relative w-full h-[580px] bg-[#EFEAE2] rounded-[34px] overflow-hidden flex flex-col font-sans border border-slate-300/40">
              
              {/* WhatsApp Header Bar */}
              <div className="bg-[#075E54] text-white px-3 py-2.5 pt-7 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-2 truncate">
                  <ArrowLeft className="w-4 h-4 text-white/90 shrink-0 cursor-pointer" />
                  
                  {/* Clinic Avatar */}
                  <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shrink-0 text-white font-black text-xs shadow-xs">
                    {scenario.clinicName.charAt(0)}
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
                      {isTyping ? "typing..." : "Online • 24/7 AI Receptionist"}
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
                    Today
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

                    {/* Rich Confirmation Card */}
                    {msg.isCard === "confirmation" && (
                      <div className="max-w-[92%] bg-white rounded-2xl border border-emerald-200 shadow-md p-3 space-y-2 text-left my-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            ✓ {msg.cardData.status}
                          </span>
                          <span className="text-xs font-black text-slate-900">{msg.cardData.token}</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{msg.cardData.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                            <span>{msg.cardData.doctor}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{msg.cardData.patient}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
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

                    {/* Rich Receipt Card */}
                    {msg.isCard === "receipt" && (
                      <div className="max-w-[92%] bg-white rounded-2xl border border-slate-200 shadow-md p-3 space-y-2 text-left my-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            Digital OPD Slip
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{msg.cardData.tokenNo}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {msg.cardData.reminder}
                        </p>
                      </div>
                    )}

                    {/* Rich Teleconsult Card */}
                    {msg.isCard === "teleconsult" && (
                      <div className="max-w-[92%] bg-white rounded-2xl border border-purple-200 shadow-md p-3 space-y-2 text-left my-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 flex items-center gap-1">
                            ✓ Video Confirmed
                          </span>
                          <span className="text-xs font-black text-purple-950">{msg.cardData.slot}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          {msg.cardData.doctor}
                        </p>
                        <div className="p-2 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                          <span className="font-mono text-[11px] text-purple-800 truncate">
                            {msg.cardData.meetLink}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-purple-700 shrink-0 ml-1" />
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
                <div className="flex-1 bg-white rounded-full h-8 px-3 text-xs text-slate-400 flex items-center border border-slate-200/60">
                  Message City Health Clinic...
                </div>
                <div className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Key Doctor Takeaways & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6 text-left">
          
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

          {/* Core Healthcare Advantages Checklist */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-black text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Instant Clinical Response in &lt; 3s</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Never lose a patient inquiry to a busy telephone line, lunchtime break, or after-hours closure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 font-black text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Google Maps 1-Click Directions</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Shares your precise clinic coordinates and metro landmarks so patients arrive on time without calling for directions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-black text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Automated Google 5-Star Reviews</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Automatically requests positive patient feedback 2 hours after the visit, rapidly boosting your Google 3-Pack ranking.
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
                Try on Your WhatsApp
              </Button>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
