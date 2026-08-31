"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Send, CheckCheck, Sparkles, Phone, Video, 
  MoreVertical, ArrowLeft, RefreshCw, Zap, ShieldCheck, 
  Globe, Stethoscope, ChevronRight, MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  sender: "patient" | "ai";
  text: string;
  time: string;
}

const SPECIALTIES = [
  { id: "derma", name: "Dermatology", doctor: "Dr. Ananya Rao", clinic: "Aura Skin & Hair Clinic", fee: 900, teleFee: 1100 },
  { id: "pedia", name: "Pediatrics", doctor: "Dr. Vinay Mehta", clinic: "Little Stars Child Clinic", fee: 800, teleFee: 1000 },
  { id: "dental", name: "Dental Care", doctor: "Dr. Rohan Kapoor", clinic: "Apex Dental & Implant Studio", fee: 600, teleFee: 800 },
  { id: "gynae", name: "Gynecology & IVF", doctor: "Dr. Priya Sharma", clinic: "Bloom Women's & IVF Care", fee: 1000, teleFee: 1200 },
  { id: "general", name: "General Medicine", doctor: "Dr. Rajesh Gupta", clinic: "City Health Care Clinic", fee: 500, teleFee: 700 },
  { id: "ortho", name: "Orthopedics", doctor: "Dr. Amit Verma", clinic: "Joint & Spine Clinic", fee: 850, teleFee: 1000 },
  { id: "sexology", name: "Sexual Wellness", doctor: "Dr. Sameer Khan", clinic: "Revive Wellness Clinic", fee: 1200, teleFee: 1500 },
];

const PRESET_PROMPTS = [
  { label: "📅 Book tomorrow 5 PM", text: "Hi, I want to book an appointment with the doctor for tomorrow at 5 PM." },
  { label: "💰 Doctor ki fee kitni hai?", text: "Doctor ki consultation fee kitni hai?" },
  { label: "🌐 Video consultation available?", text: "Do you offer online video consultation?" },
  { label: "🧪 Blood test report timeline", text: "Blood test report kab tak ready hogi?" },
  { label: "📍 Clinic timing & address", text: "Clinic ke timings aur address kya hai?" }
];

export function AIRepceptionistSimulator() {
  const [selectedSpecialty, setSelectedSpecialty] = useState(SPECIALTIES[0]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: `Namaste! 🙏 Welcome to ${SPECIALTIES[0].clinic}.\n\nI am the 24/7 AI Receptionist for ${SPECIALTIES[0].doctor}. How can I assist you with your appointment or visit today?`,
      time: "10:30 AM"
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSpecialtyChange = (spec: typeof SPECIALTIES[0]) => {
    setSelectedSpecialty(spec);
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "ai",
        text: `Namaste! 🙏 Welcome to ${spec.clinic}.\n\nI am the 24/7 AI Receptionist for ${spec.doctor} (${spec.name}). How can I assist you with your appointment or consultation today?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isTyping) return;

    const userMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newPatientMsg: ChatMessage = {
      id: `patient-${Date.now()}`,
      sender: "patient",
      text: textToSend,
      time: userMsgTime
    };

    setMessages(prev => [...prev, newPatientMsg]);
    if (!customText) setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          specialty: selectedSpecialty.name,
          doctorName: selectedSpecialty.doctor,
          clinicName: selectedSpecialty.clinic,
          consultationFee: selectedSpecialty.fee,
          allowTeleConsultation: true,
          teleConsultationFee: selectedSpecialty.teleFee
        })
      });

      const data = await res.json();
      const aiReplyText = data.reply || `Namaste! Thank you for contacting ${selectedSpecialty.clinic}. ${selectedSpecialty.doctor} is available for appointments. What time suits you best?`;

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: aiReplyText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }, 700);
    } catch (err) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: `Namaste! I can help you reserve an appointment with ${selectedSpecialty.doctor}. What day and time would you prefer?`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }, 500);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden" id="ai-simulator">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3.5 py-1 mb-4 text-xs tracking-wider uppercase">
            ⚡ Interactive Live Simulator
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Test Your Clinic&apos;s AI Receptionist <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300">
              in 60 Seconds
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Experience how Docflo captures after-hours appointments, quotes fees, handles video consults, and answers patient queries 24/7 on WhatsApp.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Controls & Value Props (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Specialty Selector Card */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-5 sm:p-6 shadow-xl">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-indigo-400" />
                Select Medical Specialty
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIALTIES.map((spec) => {
                  const isSelected = selectedSpecialty.id === spec.id;
                  return (
                    <button
                      key={spec.id}
                      onClick={() => handleSpecialtyChange(spec)}
                      className={`text-xs font-semibold px-3 py-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                          : "bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      }`}
                    >
                      {spec.name}
                    </button>
                  );
                })}
              </div>

              {/* Active Profile Info */}
              <div className="mt-5 pt-4 border-t border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{selectedSpecialty.doctor}</div>
                  <div className="text-slate-400">{selectedSpecialty.clinic}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">₹{selectedSpecialty.fee} <span className="text-[10px] text-slate-400 font-normal">In-Clinic</span></div>
                  <div className="text-indigo-300 font-bold">₹{selectedSpecialty.teleFee} <span className="text-[10px] text-slate-400 font-normal">Video</span></div>
                </div>
              </div>
            </div>

            {/* Quick Prompts to Click */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-5 sm:p-6 shadow-xl">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Tap a Sample Patient Query to Test:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={isTyping}
                    onClick={() => handleSendMessage(p.text)}
                    className="text-xs font-medium bg-slate-900/80 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white px-3 py-2 rounded-xl transition-all text-left flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Value Highlights */}
            <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900/90 rounded-2xl border border-indigo-500/30 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                Zero Hallucinations Guarantee
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Docflo never prescribes medicines or guesses diagnoses. It strictly manages appointment scheduling, clinic policies, fees, and patient experience.
              </p>
              <Link href="/register" className="block pt-2">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 group">
                  Start 14-Day Free Trial for Your Clinic
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

          </div>

          {/* Right Realistic WhatsApp Screen (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[440px] bg-[#0b141a] rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[580px] sm:h-[620px] relative">
              
              {/* WhatsApp Header */}
              <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between text-white shrink-0 border-b border-slate-700/50">
                <div className="flex items-center gap-3 min-w-0">
                  <ArrowLeft className="w-4 h-4 text-slate-400 cursor-pointer" />
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-white">
                      {selectedSpecialty.doctor.replace("Dr. ", "").charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1f2c34] rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                      <span>{selectedSpecialty.doctor}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[9px] px-1 py-0 h-4 font-bold">
                        AI
                      </Badge>
                    </div>
                    <div className="text-[11px] text-emerald-400 leading-tight">online • 24/7 Receptionist</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                  <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* WhatsApp Chat Canvas */}
              <div className="flex-1 bg-[#0b141a] p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
                
                {/* Encryption Badge */}
                <div className="text-center my-1">
                  <span className="bg-[#182229] text-amber-200/80 text-[10px] px-3 py-1 rounded-lg border border-amber-500/20 inline-block font-medium">
                    🔒 Messages are end-to-end encrypted
                  </span>
                </div>

                {messages.map((msg) => {
                  const isAi = msg.sender === "ai";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isAi ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-md relative ${
                          isAi
                            ? "bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/30"
                            : "bg-[#005c4b] text-white rounded-tr-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                          <span>{msg.time}</span>
                          {!isAi && <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-[#202c33] border border-slate-700/30 text-slate-300 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                      </div>
                      <span className="text-[11px] text-slate-400">AI is replying...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* WhatsApp Input Bar */}
              <div className="bg-[#1f2c34] p-2.5 flex items-center gap-2 shrink-0 border-t border-slate-700/50">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder="Type a message (English, Hindi, Hinglish)..."
                  className="flex-1 bg-[#2a3942] text-xs text-white placeholder-slate-400 rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent"
                />
                <Button
                  size="icon"
                  disabled={!inputText.trim() || isTyping}
                  onClick={() => handleSendMessage()}
                  className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 shadow-md disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
