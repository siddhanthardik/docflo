"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Send, CheckCheck, Phone, Video, 
  MoreVertical, ArrowLeft, Stethoscope, ChevronRight 
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
    <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-200/80 relative" id="ai-simulator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Clean Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Test Your Clinic&apos;s AI Receptionist in 60 Seconds
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Select your medical specialty and test live patient inquiries in English, Hindi, or Hinglish.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          
          {/* Left Controls & Preset Prompts (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Specialty Selector Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Select Medical Specialty
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIALTIES.map((spec) => {
                  const isSelected = selectedSpecialty.id === spec.id;
                  return (
                    <button
                      key={spec.id}
                      onClick={() => handleSpecialtyChange(spec)}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {spec.name}
                    </button>
                  );
                })}
              </div>

              {/* Active Profile Info */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedSpecialty.doctor}</div>
                  <div className="text-slate-500 text-[11px]">{selectedSpecialty.clinic}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-700 font-bold">₹{selectedSpecialty.fee} <span className="text-[10px] text-slate-400 font-normal">In-Clinic</span></div>
                  <div className="text-blue-700 font-bold">₹{selectedSpecialty.teleFee} <span className="text-[10px] text-slate-400 font-normal">Video</span></div>
                </div>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tap a Sample Patient Query to Test:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={isTyping}
                    onClick={() => handleSendMessage(p.text)}
                    className="text-xs font-medium bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-900 px-3 py-2 rounded-xl transition-all text-left shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct 14-Day Free Trial CTA Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Ready to deploy this AI for your clinic?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your clinic WhatsApp in 2 minutes. No credit card required.
              </p>
              <Link href="/register" className="block pt-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 group h-11 rounded-xl">
                  Start 14-Day Free Trial
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

          </div>

          {/* Right Clean WhatsApp Mobile Mockup (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-[420px] bg-[#efeae2] rounded-[2.2rem] border-[7px] border-slate-900 shadow-xl overflow-hidden flex flex-col h-[560px] sm:h-[580px] relative">
              
              {/* WhatsApp Official Clean Header */}
              <div className="bg-[#008069] px-4 py-3 flex items-center justify-between text-white shrink-0 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <ArrowLeft className="w-4 h-4 text-white/80 cursor-pointer" />
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xs text-white">
                      {selectedSpecialty.doctor.replace("Dr. ", "").charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-300 border-2 border-[#008069] rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate flex items-center gap-1.5 leading-tight">
                      <span>{selectedSpecialty.doctor}</span>
                      <Badge className="bg-white/20 text-white border-0 text-[9px] px-1 py-0 h-4 font-bold">
                        AI
                      </Badge>
                    </div>
                    <div className="text-[11px] text-emerald-100 leading-tight">online • 24/7 Receptionist</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                  <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* WhatsApp Light Chat Canvas */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                
                {/* Encryption Pill */}
                <div className="text-center my-1">
                  <span className="bg-[#ffeecd] text-[#54656f] text-[10px] px-3 py-1 rounded-md shadow-2xs inline-block font-medium">
                    🔒 Messages are end-to-end encrypted
                  </span>
                </div>

                {messages.map((msg) => {
                  const isAi = msg.sender === "ai";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isAi ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[84%] sm:max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed shadow-xs relative ${
                          isAi
                            ? "bg-white text-slate-800 rounded-tl-none border border-slate-200/60"
                            : "bg-[#d9fdd3] text-slate-900 rounded-tr-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                          <span>{msg.time}</span>
                          {!isAi && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
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
                    <div className="bg-white border border-slate-200/70 text-slate-600 rounded-xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-2 shadow-xs">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce" />
                      </div>
                      <span className="text-[11px] text-slate-400">AI is typing...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* WhatsApp Light Input Bar */}
              <div className="bg-[#f0f2f5] p-2.5 flex items-center gap-2 shrink-0 border-t border-slate-200">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder="Type in English, Hindi, or Hinglish..."
                  className="flex-1 bg-white text-xs text-slate-900 placeholder-slate-400 rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#008069] border border-slate-200 shadow-2xs"
                />
                <Button
                  size="icon"
                  disabled={!inputText.trim() || isTyping}
                  onClick={() => handleSendMessage()}
                  className="w-9 h-9 rounded-full bg-[#008069] hover:bg-[#006e5a] text-white shrink-0 shadow-xs disabled:opacity-40"
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
