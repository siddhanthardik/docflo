"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, CheckCheck, Phone, Video, 
  MoreVertical, ArrowLeft, Stethoscope, ChevronRight, 
  QrCode, User, Mail, Building2, Sparkles, Bot, Check, Smartphone, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  sender: "patient" | "ai";
  text: string;
  time: string;
}

const SPECIALTIES = [
  { id: "derma", name: "Dermatology", defaultDoc: "Dr. Ananya Rao", defaultClinic: "Aura Skin Clinic", fee: 900, teleFee: 1100 },
  { id: "pedia", name: "Pediatrics", defaultDoc: "Dr. Vinay Mehta", defaultClinic: "Little Stars Clinic", fee: 800, teleFee: 1000 },
  { id: "dental", name: "Dental Care", defaultDoc: "Dr. Rohan Kapoor", defaultClinic: "Apex Dental Studio", fee: 600, teleFee: 800 },
  { id: "gynae", name: "Gynecology & IVF", defaultDoc: "Dr. Priya Sharma", defaultClinic: "Bloom Women's Care", fee: 1000, teleFee: 1200 },
  { id: "general", name: "General Medicine", defaultDoc: "Dr. Rajesh Gupta", defaultClinic: "City Health Clinic", fee: 500, teleFee: 700 },
  { id: "ortho", name: "Orthopedics", defaultDoc: "Dr. Amit Verma", defaultClinic: "Joint & Spine Clinic", fee: 850, teleFee: 1000 },
  { id: "sexology", name: "Sexual Wellness", defaultDoc: "Dr. Sameer Khan", defaultClinic: "Revive Wellness Clinic", fee: 1200, teleFee: 1500 },
  { id: "cardio", name: "Cardiology", defaultDoc: "Dr. Sanjay Deshmukh", defaultClinic: "Heart & Vascular Care", fee: 1500, teleFee: 1800 },
];

const PRESET_PROMPTS = [
  { label: "📅 Book tomorrow 5 PM", text: "Hi, I want to book an appointment with the doctor for tomorrow at 5 PM." },
  { label: "💰 Doctor ki fee kitni hai?", text: "Doctor ki consultation fee kitni hai?" },
  { label: "🌐 Video consultation available?", text: "Do you offer online video consultation?" },
  { label: "🧪 Blood test report timeline", text: "Blood test report kab tak ready hogi?" },
  { label: "📍 Clinic timing & address", text: "Clinic ke timings aur address kya hai?" }
];

export function AIRepceptionistSimulator() {
  // Doctor Lead Configuration State
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [doctorName, setDoctorName] = useState(SPECIALTIES[0].defaultDoc);
  const [clinicName, setClinicName] = useState(SPECIALTIES[0].defaultClinic);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [assistantName, setAssistantName] = useState("Mona");
  const [activeTab, setActiveTab] = useState<"chat" | "qr">("chat");

  // Chat State
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: `Namaste! 🙏 Welcome to ${SPECIALTIES[0].defaultClinic}.\n\nI am Mona, the 24/7 AI Receptionist for ${SPECIALTIES[0].defaultDoc}. How can I assist you with your appointment or visit today?`,
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

  // Sync Initial Greeting when doctor edits details
  const updateAiGreeting = (newDoc: string, newClinic: string, newAssistant: string, newSpecName: string) => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "ai",
        text: `Namaste! 🙏 Welcome to ${newClinic || "our clinic"}.\n\nI am ${newAssistant || "Mona"}, the 24/7 AI Receptionist for ${newDoc || "the Doctor"} (${newSpecName}). How can I assist you with your appointment or consultation today?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  const handleSpecialtySelect = (spec: typeof SPECIALTIES[0]) => {
    setSpecialty(spec);
    // If doctor hasn't typed custom name, use defaults
    if (!doctorName || SPECIALTIES.some(s => s.defaultDoc === doctorName)) {
      setDoctorName(spec.defaultDoc);
    }
    if (!clinicName || SPECIALTIES.some(s => s.defaultClinic === clinicName)) {
      setClinicName(spec.defaultClinic);
    }
    updateAiGreeting(
      (!doctorName || SPECIALTIES.some(s => s.defaultDoc === doctorName)) ? spec.defaultDoc : doctorName,
      (!clinicName || SPECIALTIES.some(s => s.defaultClinic === clinicName)) ? spec.defaultClinic : clinicName,
      assistantName,
      spec.name
    );
  };

  // Background Lead Capture Trigger
  const captureLeadData = async () => {
    if (leadCaptured || (!email && !phone)) return;
    try {
      await fetch("/api/demo/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: doctorName,
          email,
          phone,
          clinicName,
          specialty: specialty.name,
          assistantName,
        })
      });
      setLeadCaptured(true);
    } catch (e) {
      console.warn("Lead capture background error:", e);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isTyping) return;

    captureLeadData();

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
          specialty: specialty.name,
          doctorName: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
          clinicName,
          consultationFee: specialty.fee,
          allowTeleConsultation: true,
          teleConsultationFee: specialty.teleFee
        })
      });

      const data = await res.json();
      const aiReplyText = data.reply || `Namaste! Thank you for contacting ${clinicName}. ${doctorName} is available for appointments. What time suits you best?`;

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
            text: `Namaste! I can help you reserve an appointment with ${doctorName}. What day and time would you prefer?`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }, 500);
    }
  };

  // WhatsApp Click-to-Chat / QR URL
  const demoWhatsAppPhone = "919999999999"; // Fallback demo bot
  const prefilledWaText = encodeURIComponent(
    `Hi ${assistantName}, I want to book an appointment with ${doctorName} at ${clinicName}.`
  );
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    `https://wa.me/${demoWhatsAppPhone}?text=${prefilledWaText}`
  )}&color=008069`;

  const registrationParams = new URLSearchParams({
    name: doctorName.replace(/^Dr\.\s*/i, ""),
    clinicName: clinicName || "",
    email: email || "",
    phone: phone || "",
    specialty: specialty.name || "",
  }).toString();

  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-200/80 relative" id="ai-simulator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Test Your Clinic&apos;s AI Receptionist in 60 Seconds
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Personalize your doctor &amp; clinic profile below, test live patient queries, or scan the QR code to experience it on your phone.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          
          {/* Left Form: Personalize Doctor Profile & Quick Prompts (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Doctor & Clinic Personalization Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Your Clinic Profile
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  Live Sync
                </span>
              </div>

              {/* Specialty Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Medical Specialty
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {SPECIALTIES.map((spec) => {
                    const isSelected = specialty.id === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => handleSpecialtySelect(spec)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border text-left transition-all truncate ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white shadow-2xs font-semibold"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {spec.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doctor Name & Receptionist Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Doctor Name
                  </label>
                  <Input
                    type="text"
                    value={doctorName}
                    onChange={(e) => {
                      setDoctorName(e.target.value);
                      updateAiGreeting(e.target.value, clinicName, assistantName, specialty.name);
                    }}
                    onBlur={captureLeadData}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    AI Assistant Name
                  </label>
                  <Input
                    type="text"
                    value={assistantName}
                    onChange={(e) => {
                      setAssistantName(e.target.value);
                      updateAiGreeting(doctorName, clinicName, e.target.value, specialty.name);
                    }}
                    placeholder="e.g. Mona / Priya / Aarav"
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              {/* Clinic Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinic / Hospital Name
                </label>
                <Input
                  type="text"
                  value={clinicName}
                  onChange={(e) => {
                    setClinicName(e.target.value);
                    updateAiGreeting(doctorName, e.target.value, assistantName, specialty.name);
                  }}
                  onBlur={captureLeadData}
                  placeholder="e.g. Sharma Skin & Hair Clinic"
                  className="text-xs h-9 bg-slate-50 border-slate-200"
                />
              </div>

              {/* Optional Email / WhatsApp for instant sandbox lead */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Doctor Email (Optional)
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={captureLeadData}
                    placeholder="doctor@gmail.com"
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    WhatsApp Number (Optional)
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={captureLeadData}
                    placeholder="+91 98765 43210"
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

            </div>

            {/* Quick 1-Tap Prompts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tap a Sample Patient Query to Test:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isTyping}
                    onClick={() => {
                      setActiveTab("chat");
                      handleSendMessage(p.text);
                    }}
                    className="text-xs font-medium bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-900 px-3 py-1.5 rounded-lg transition-all text-left shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct 14-Day Free Trial CTA Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Ready to deploy {assistantName} for {clinicName || "your clinic"}?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your clinic WhatsApp in 2 minutes. No credit card required.
              </p>
              <Link href={`/register?${registrationParams}`} className="block pt-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 group h-11 rounded-xl">
                  Start 14-Day Free Trial
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

          </div>

          {/* Right Column: Dynamic WhatsApp & QR Switcher (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* View Switcher Tabs (Chat vs QR) */}
            <div className="bg-slate-200/80 p-1 rounded-xl mb-4 flex gap-1 text-xs font-semibold w-full max-w-[420px]">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "chat" 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                Interactive Chat Screen
              </button>
              <button
                type="button"
                onClick={() => {
                  captureLeadData();
                  setActiveTab("qr");
                }}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "qr" 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                Scan QR with Phone
              </button>
            </div>

            {/* TAB 1: Live Interactive WhatsApp Screen */}
            {activeTab === "chat" && (
              <div className="w-full max-w-[420px] bg-[#efeae2] rounded-[2.2rem] border-[7px] border-slate-900 shadow-xl overflow-hidden flex flex-col h-[560px] sm:h-[580px] relative animate-in fade-in duration-200">
                
                {/* WhatsApp Official Header */}
                <div className="bg-[#008069] px-4 py-3 flex items-center justify-between text-white shrink-0 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <ArrowLeft className="w-4 h-4 text-white/80 cursor-pointer" />
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xs text-white uppercase">
                        {(doctorName.replace(/^Dr\.\s*/i, "") || "D").charAt(0)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-300 border-2 border-[#008069] rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate flex items-center gap-1.5 leading-tight">
                        <span className="truncate">{doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`}</span>
                        <Badge className="bg-white/20 text-white border-0 text-[9px] px-1 py-0 h-4 font-bold shrink-0">
                          {assistantName || "AI"}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-emerald-100 leading-tight truncate">
                        online • 24/7 AI Receptionist
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/90 shrink-0">
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
                        <span className="text-[11px] text-slate-400">{assistantName} is typing...</span>
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
                    type="button"
                    disabled={!inputText.trim() || isTyping}
                    onClick={() => handleSendMessage()}
                    className="w-9 h-9 rounded-full bg-[#008069] hover:bg-[#006e5a] text-white shrink-0 shadow-xs disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

              </div>
            )}

            {/* TAB 2: Scan QR Code with Real Phone */}
            {activeTab === "qr" && (
              <div className="w-full max-w-[420px] bg-white rounded-[2.2rem] border-[7px] border-slate-900 shadow-xl p-6 sm:p-8 flex flex-col items-center justify-between h-[560px] sm:h-[580px] animate-in fade-in duration-200 text-center">
                
                <div className="space-y-1">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold">
                    Scan with Phone Camera
                  </Badge>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Test on Your Own WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[280px]">
                    Scan below to test {assistantName} configured for {clinicName}.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-white border-2 border-dashed border-emerald-500/40 rounded-2xl shadow-sm">
                  <img
                    src={qrCodeUrl}
                    alt="WhatsApp AI Receptionist QR Code"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                </div>

                {/* Direct WhatsApp Open Button */}
                <div className="w-full space-y-2">
                  <a
                    href={`https://wa.me/${demoWhatsAppPhone}?text=${prefilledWaText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={captureLeadData}
                    className="w-full block"
                  >
                    <Button className="w-full bg-[#008069] hover:bg-[#006e5a] text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                      <Smartphone className="w-4 h-4" />
                      Open WhatsApp on this Device
                    </Button>
                  </a>
                  <p className="text-[10px] text-slate-400">
                    Works on Android, iOS, &amp; WhatsApp Web
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}
