"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, CheckCheck, Phone, Video, 
  MoreVertical, ArrowLeft, Stethoscope, ChevronRight, 
  QrCode, User, Mail, Building2, Sparkles, Bot, Check, Smartphone, 
  RefreshCw, PowerOff, ShieldCheck, Clock, CheckCircle2, AlertCircle
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

const ALL_SPECIALTIES = [
  { id: "derma", name: "Dermatology", defaultDoc: "Dr. Ananya Rao", defaultClinic: "Aura Skin & Laser Clinic", fee: 900, teleFee: 1100 },
  { id: "dental", name: "Dentistry", defaultDoc: "Dr. Rohan Kapoor", defaultClinic: "Apex Dental & Implant Studio", fee: 600, teleFee: 800 },
  { id: "pedia", name: "Pediatrics", defaultDoc: "Dr. Vinay Mehta", defaultClinic: "Little Stars Child Clinic", fee: 800, teleFee: 1000 },
  { id: "gynae", name: "Gynecology & Obstetrics", defaultDoc: "Dr. Priya Sharma", defaultClinic: "Bloom Women's & Maternity Clinic", fee: 1000, teleFee: 1200 },
  { id: "general", name: "General Medicine", defaultDoc: "Dr. Rajesh Gupta", defaultClinic: "City Health Care Clinic", fee: 500, teleFee: 700 },
  { id: "ortho", name: "Orthopedics", defaultDoc: "Dr. Amit Verma", defaultClinic: "Joint & Spine Bone Clinic", fee: 850, teleFee: 1000 },
  { id: "cardio", name: "Cardiology", defaultDoc: "Dr. Sanjay Deshmukh", defaultClinic: "Heart & Vascular Care", fee: 1500, teleFee: 1800 },
  { id: "ent", name: "ENT (Otolaryngology)", defaultDoc: "Dr. Meera Nambiar", defaultClinic: "Care ENT Speciality Clinic", fee: 750, teleFee: 950 },
  { id: "ophthalmology", name: "Ophthalmology", defaultDoc: "Dr. Alok Nath", defaultClinic: "Vision Eye Care Centre", fee: 700, teleFee: 900 },
  { id: "diabetes", name: "Diabetology", defaultDoc: "Dr. Kavita Joshi", defaultClinic: "Sugar & Diabetes Care Clinic", fee: 900, teleFee: 1100 },
  { id: "psychiatry", name: "Psychiatry", defaultDoc: "Dr. Arun Sen", defaultClinic: "Mind Wellness Clinic", fee: 1500, teleFee: 1800 },
  { id: "physio", name: "Physiotherapy", defaultDoc: "Dr. Pooja Nair", defaultClinic: "Active Motion Rehab Clinic", fee: 600, teleFee: 800 },
  { id: "gastro", name: "Gastroenterology", defaultDoc: "Dr. Nikhil Kulkarni", defaultClinic: "Digestive Health & Liver Clinic", fee: 1200, teleFee: 1400 },
  { id: "pulmo", name: "Pulmonology & Respiratory Medicine", defaultDoc: "Dr. Sandeep Bajaj", defaultClinic: "Breathe Easy Chest & Allergy Care", fee: 1000, teleFee: 1200 },
  { id: "uro", name: "Urology", defaultDoc: "Dr. Vivek Chhabra", defaultClinic: "UroCare Kidney & Prostate Clinic", fee: 1200, teleFee: 1500 },
  { id: "neuro", name: "Neurology", defaultDoc: "Dr. Sunita Bansal", defaultClinic: "NeuroLife Brain & Spine Centre", fee: 1500, teleFee: 1800 },
  { id: "neurosurg", name: "Neurosurgery & Spine Surgery", defaultDoc: "Dr. Vikram Sethi", defaultClinic: "Advanced Spine & Neuro Care", fee: 1800, teleFee: 2000 },
  { id: "nephro", name: "Nephrology", defaultDoc: "Dr. Pradeep Mishra", defaultClinic: "Renal Health & Kidney Clinic", fee: 1200, teleFee: 1400 },
  { id: "onco", name: "Oncology", defaultDoc: "Dr. Rajeev Aggarwal", defaultClinic: "Hope Cancer Care Centre", fee: 1800, teleFee: 2000 },
  { id: "endo", name: "Endocrinology", defaultDoc: "Dr. Ritu Saxena", defaultClinic: "Endocrine & Hormone Wellness", fee: 1100, teleFee: 1300 },
  { id: "ivf", name: "IVF & Infertility", defaultDoc: "Dr. Radhika Singhal", defaultClinic: "Miracle IVF & Fertility Centre", fee: 1500, teleFee: 1800 },
  { id: "cosmetology", name: "Cosmetology & Aesthetic Medicine", defaultDoc: "Dr. Shalini Roy", defaultClinic: "Glow Aesthetics & Skin Studio", fee: 1000, teleFee: 1200 },
  { id: "trichology", name: "Trichology & Hair Transplant", defaultDoc: "Dr. Gaurav Chopra", defaultClinic: "HairCraft Restoration Clinic", fee: 900, teleFee: 1100 },
  { id: "sexology", name: "Sexology & Andrology", defaultDoc: "Dr. Sameer Khan", defaultClinic: "Revive Men & Women Wellness", fee: 1200, teleFee: 1500 },
  { id: "gensurg", name: "General Surgery", defaultDoc: "Dr. Ashok Mathur", defaultClinic: "Surgical Care & Daycare Centre", fee: 1000, teleFee: 1200 },
  { id: "laparo", name: "Laparoscopic Surgery", defaultDoc: "Dr. Manish Tandon", defaultClinic: "Minimal Access Surgery Clinic", fee: 1100, teleFee: 1300 },
  { id: "plastic", name: "Plastic & Reconstructive Surgery", defaultDoc: "Dr. Deepak Singhania", defaultClinic: "Form & Contour Plastic Surgery", fee: 1500, teleFee: 1800 },
  { id: "pediasurg", name: "Pediatric Surgery", defaultDoc: "Dr. Vandana Goyal", defaultClinic: "Child Surgical Care Centre", fee: 1200, teleFee: 1400 },
  { id: "dietetics", name: "Dietetics & Clinical Nutrition", defaultDoc: "Dt. Simran Kaur", defaultClinic: "NutriLife Diet & Wellness Clinic", fee: 700, teleFee: 800 },
  { id: "psychology", name: "Clinical Psychology & Counseling", defaultDoc: "Dr. Neha Bhatt", defaultClinic: "MindSpace Therapy & Counseling", fee: 1200, teleFee: 1400 },
  { id: "rheuma", name: "Rheumatology", defaultDoc: "Dr. Tarun Sood", defaultClinic: "Arthritis & Autoimmune Care Clinic", fee: 1200, teleFee: 1400 },
  { id: "hematology", name: "Hematology", defaultDoc: "Dr. Anirudh Sen", defaultClinic: "Blood Disorders & Bone Marrow Clinic", fee: 1400, teleFee: 1600 },
  { id: "infectious", name: "Infectious Diseases", defaultDoc: "Dr. Rahul Mahajan", defaultClinic: "Infection & Travel Medicine Clinic", fee: 1000, teleFee: 1200 },
  { id: "sports", name: "Sports Medicine", defaultDoc: "Dr. Karan Malhotra", defaultClinic: "ProAthlete Sports Injury & Rehab", fee: 1100, teleFee: 1300 },
  { id: "vascular", name: "Vascular Surgery", defaultDoc: "Dr. Sunil Khurana", defaultClinic: "Vein & Vascular Care Clinic", fee: 1300, teleFee: 1500 },
  { id: "pathology", name: "Pathology & Laboratory Medicine", defaultDoc: "Dr. Harish Bhatia", defaultClinic: "Precision Diagnostic Care", fee: 500, teleFee: 600 },
  { id: "radiology", name: "Radiology & Imaging", defaultDoc: "Dr. Smita Patwardhan", defaultClinic: "ScanWell Diagnostic Centre", fee: 600, teleFee: 700 },
  { id: "audiology", name: "Audiology & Speech Therapy", defaultDoc: "Dr. Swati Ghosh", defaultClinic: "HearWell Speech & Hearing Clinic", fee: 800, teleFee: 900 },
  { id: "occupational", name: "Occupational Therapy", defaultDoc: "Dr. Kiran Rao", defaultClinic: "StepAhead Occupational Therapy", fee: 800, teleFee: 900 },
  { id: "ayurveda", name: "Ayurveda", defaultDoc: "Vaidya Shrikant Deshpande", defaultClinic: "AyurVeda Wellness & Panchakarma", fee: 600, teleFee: 750 },
  { id: "homeopathy", name: "Homeopathy", defaultDoc: "Dr. Mukesh Solanki", defaultClinic: "Holistic Homeopathic Healing", fee: 500, teleFee: 650 },
  { id: "naturopathy", name: "Naturopathy & Yoga", defaultDoc: "Dr. Arvind Patel", defaultClinic: "NatureCare Holistic Wellness", fee: 600, teleFee: 750 },
  { id: "other", name: "Other Specialty", defaultDoc: "Dr. Clinic Specialist", defaultClinic: "Healthcare Speciality Clinic", fee: 700, teleFee: 900 },
];

export function AIRepceptionistSimulator() {
  // Doctor Lead Configuration State
  const [specialty, setSpecialty] = useState(ALL_SPECIALTIES[0]);
  const [doctorName, setDoctorName] = useState(ALL_SPECIALTIES[0].defaultDoc);
  const [clinicName, setClinicName] = useState(ALL_SPECIALTIES[0].defaultClinic);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [assistantName, setAssistantName] = useState("Mona");
  const [activeTab, setActiveTab] = useState<"qr" | "chat">("qr");

  // QR Sandbox State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"IDLE" | "INITIALIZING" | "SCAN_QR" | "CONNECTED" | "DISCONNECTED">("IDLE");
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes in seconds
  const [qrError, setQrError] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Chat State
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: `Namaste! 🙏 Welcome to ${ALL_SPECIALTIES[0].defaultClinic}.\n\nI am Mona, the 24/7 AI Receptionist for ${ALL_SPECIALTIES[0].defaultDoc}. How can I assist you with your appointment or visit today?`,
      time: "10:30 AM"
    }
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  sessionIdRef.current = sessionId;

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Clean up sandbox session when closing browser tab or unmounting
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        navigator.sendBeacon(
          "/api/demo/whatsapp/qr",
          JSON.stringify({ sessionId: sessionIdRef.current })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (sessionIdRef.current) {
        fetch("/api/demo/whatsapp/qr", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
          keepalive: true
        }).catch(() => {});
      }
    };
  }, []);

  // Poll connection status for live sandbox
  useEffect(() => {
    if (!sessionId || connectionStatus === "DISCONNECTED") {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/demo/whatsapp/qr?sessionId=${encodeURIComponent(sessionId)}`);
        const data = await res.json();

        if (data.status === "CONNECTED") {
          setConnectionStatus("CONNECTED");
          setQrCodeDataUrl(null);
        } else if (data.status === "SCAN_QR" && data.qr) {
          setConnectionStatus("SCAN_QR");
          setQrCodeDataUrl(data.qr);
        } else if (data.status === "DISCONNECTED") {
          setConnectionStatus("DISCONNECTED");
        }

        if (data.timeRemainingSeconds !== undefined) {
          setTimeRemaining(data.timeRemainingSeconds);
          if (data.timeRemainingSeconds <= 0) {
            setConnectionStatus("DISCONNECTED");
          }
        }
      } catch (err) {
        console.warn("[QR Poll] Error:", err);
      }
    }, 1500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessionId, connectionStatus]);

  // Countdown timer in UI
  useEffect(() => {
    if (connectionStatus !== "CONNECTED" && connectionStatus !== "SCAN_QR") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setConnectionStatus("DISCONNECTED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [connectionStatus]);

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

  const handleSpecialtyChange = (specId: string) => {
    const found = ALL_SPECIALTIES.find((s) => s.id === specId) || ALL_SPECIALTIES[0];
    setSpecialty(found);

    const isDefaultDoc = ALL_SPECIALTIES.some((s) => s.defaultDoc === doctorName);
    const isDefaultClinic = ALL_SPECIALTIES.some((s) => s.defaultClinic === clinicName);

    const newDoc = isDefaultDoc ? found.defaultDoc : doctorName;
    const newClinic = isDefaultClinic ? found.defaultClinic : clinicName;

    if (isDefaultDoc) setDoctorName(found.defaultDoc);
    if (isDefaultClinic) setClinicName(found.defaultClinic);

    updateAiGreeting(newDoc, newClinic, assistantName, found.name);
  };

  // Generate Live Baileys QR Code
  const handleGenerateQR = async () => {
    if (!email || !email.includes("@")) {
      setQrError("Please enter a valid doctor email address to generate your QR code.");
      return;
    }

    setQrError(null);
    setIsGeneratingQr(true);
    setConnectionStatus("INITIALIZING");
    setActiveTab("qr");

    try {
      const res = await fetch("/api/demo/whatsapp/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
          clinicName: clinicName || `${doctorName}'s Clinic`,
          specialty: specialty.name,
          assistantName: assistantName || "Mona",
          email,
          phone,
          sessionId: sessionId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to start WhatsApp connection");
      }

      setSessionId(data.sessionId);
      if (data.qr) {
        setQrCodeDataUrl(data.qr);
        setConnectionStatus("SCAN_QR");
      } else if (data.status === "CONNECTED") {
        setConnectionStatus("CONNECTED");
      } else {
        setConnectionStatus("SCAN_QR");
      }
      setTimeRemaining(data.timeRemainingSeconds || 600);
    } catch (err: any) {
      setQrError(err.message || "Failed to generate QR code. Please try again.");
      setConnectionStatus("IDLE");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Disconnect & Logout
  const handleDisconnect = async () => {
    if (sessionId) {
      await fetch("/api/demo/whatsapp/qr", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      }).catch(() => {});
    }
    setConnectionStatus("IDLE");
    setQrCodeDataUrl(null);
    setSessionId(null);
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
          specialty: specialty.name,
          doctorName: doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`,
          clinicName,
          assistantName: assistantName || "Mona",
          consultationFee: specialty.fee,
          allowTeleConsultation: true,
          teleConsultationFee: specialty.teleFee,
          conversationHistory: messages.slice(-6).map(m => `${m.sender === "ai" ? (assistantName || "AI") : "Patient"}: ${m.text}`)
        })
      });

      const data = await res.json();
      const rawText = data.reply || `Namaste! Thank you for contacting ${clinicName}. ${doctorName} is available for appointments. What time suits you best?`;
      const aiReplyText = rawText
        .replace(/\[(RESCHEDULE_APPOINTMENT|CANCEL_APPOINTMENT|CANCEL_PATIENT_APPOINTMENT|PATIENT_CANCEL_APPOINTMENT|BOOK_NEW_APPOINTMENT|MESSAGE_PATIENT|BOOK_APPOINTMENT|DELEGATE_PATIENT_TASK|CLARIFY_TASK)(?::.*?)?\]/gi, "")
        .trim();

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

  const minutesRemaining = Math.floor(timeRemaining / 60);
  const secondsRemaining = timeRemaining % 60;
  const formattedTimeRemaining = `${minutesRemaining}:${secondsRemaining < 10 ? "0" : ""}${secondsRemaining}`;

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
            Enter your doctor profile below to generate your live WhatsApp QR code. Test real patient interactions on your own phone with 100% automatic session logout.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          
          {/* Left Form: Doctor Profile Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Doctor & Clinic Personalization Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  1. Setup Your Clinic AI
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Auto-Logout Sandbox
                </span>
              </div>

              {/* Medical Specialty Selector (40+ Specialties) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Medical Specialty
                </label>
                <select
                  value={specialty.id}
                  onChange={(e) => handleSpecialtyChange(e.target.value)}
                  className="w-full text-xs h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all cursor-pointer"
                >
                  {ALL_SPECIALTIES.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
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
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="text-xs h-10 bg-slate-50 border-slate-200"
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
                    placeholder="e.g. Mona / Priya"
                    className="text-xs h-10 bg-slate-50 border-slate-200"
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
                  placeholder="e.g. Sharma Skin & Hair Clinic"
                  className="text-xs h-10 bg-slate-50 border-slate-200"
                />
              </div>

              {/* Email & WhatsApp Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Doctor Email <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setQrError(null);
                    }}
                    placeholder="doctor@gmail.com"
                    className={`text-xs h-10 bg-slate-50 ${
                      qrError ? "border-rose-400 focus:ring-rose-400" : "border-slate-200"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    WhatsApp Number (Optional)
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="text-xs h-10 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              {qrError && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {qrError}
                </p>
              )}

              {/* Generate QR Button */}
              <Button
                type="button"
                onClick={handleGenerateQR}
                disabled={isGeneratingQr || connectionStatus === "CONNECTED"}
                className="w-full bg-[#008069] hover:bg-[#006e5a] text-white font-bold text-xs sm:text-sm h-11 rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2"
              >
                {isGeneratingQr ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating WhatsApp QR Code...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Generate WhatsApp QR Code</span>
                  </>
                )}
              </Button>

            </div>

            {/* Direct 14-Day Free Trial CTA Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm">
                Ready to deploy {assistantName} permanently?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your clinic WhatsApp permanently in 2 minutes. No credit card required.
              </p>
              <Link href={`/register?${registrationParams}`} className="block pt-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 group h-11 rounded-xl">
                  Start 14-Day Free Trial
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

          </div>

          {/* Right Column: Dynamic WhatsApp QR Linking Canvas & Chat Screen (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* View Switcher Tabs (QR vs Simulator Screen) */}
            <div className="bg-slate-200/80 p-1 rounded-xl mb-4 flex gap-1 text-xs font-semibold w-full max-w-[420px]">
              <button
                type="button"
                onClick={() => setActiveTab("qr")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "qr" 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                Scan WhatsApp QR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "chat" 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-blue-600" />
                On-Screen Chat Mockup
              </button>
            </div>

            {/* TAB 1: Live WhatsApp QR Code & Linking Steps */}
            {activeTab === "qr" && (
              <div className="w-full max-w-[420px] bg-white rounded-[2.2rem] border-[7px] border-slate-900 shadow-xl p-5 sm:p-6 flex flex-col items-center justify-between min-h-[560px] sm:min-h-[580px] animate-in fade-in duration-200 text-center relative">
                
                {/* Header Badge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold">
                      2. Link Your WhatsApp Live
                    </Badge>
                    {(connectionStatus === "CONNECTED" || connectionStatus === "SCAN_QR") && (
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formattedTimeRemaining}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {connectionStatus === "CONNECTED" 
                      ? "🟢 AI Receptionist is Live!" 
                      : `Link WhatsApp to Test ${assistantName}`}
                  </h3>
                </div>

                {/* State: CONNECTED */}
                {connectionStatus === "CONNECTED" ? (
                  <div className="my-auto space-y-4 py-4 px-2 w-full">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Your WhatsApp is Linked to {assistantName}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-[320px] mx-auto">
                        Send any test inquiry from another phone to your WhatsApp number. {assistantName} will reply as your 24/7 AI Receptionist!
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1 text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">🔒 Ephemeral Sandbox Guarantee:</div>
                      <p className="text-[11px] text-slate-500">
                        Session automatically logs out in <strong>{formattedTimeRemaining}</strong> or when you close this browser tab.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleDisconnect}
                      variant="outline"
                      className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold h-10 rounded-xl"
                    >
                      <PowerOff className="w-3.5 h-3.5 mr-1.5" />
                      Disconnect &amp; Logout Now
                    </Button>
                  </div>
                ) : (
                  /* State: SCAN_QR or IDLE */
                  <div className="my-auto space-y-4 py-2 w-full flex flex-col items-center">
                    
                    {/* QR Code Canvas */}
                    <div className="p-3.5 bg-white border-2 border-dashed border-emerald-500/40 rounded-2xl shadow-sm relative flex items-center justify-center min-w-[210px] min-h-[210px]">
                      {connectionStatus === "INITIALIZING" ? (
                        <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                          <RefreshCw className="w-6 h-6 animate-spin text-[#008069]" />
                          <span>Generating live QR...</span>
                        </div>
                      ) : qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="WhatsApp AI Sandbox QR Code"
                          className="w-48 h-48 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500 text-xs p-4 text-center">
                          <QrCode className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                          <span>Enter email and click <strong>&quot;Generate WhatsApp QR Code&quot;</strong> to link your phone.</span>
                        </div>
                      )}
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-left w-full space-y-2 text-xs">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                        4 Simple Steps to Link:
                      </div>
                      <ol className="space-y-1.5 text-slate-600 text-[11px] list-decimal pl-4 leading-tight">
                        <li>Open <strong>WhatsApp</strong> on your phone.</li>
                        <li>Tap <strong>Settings (⚙️)</strong> on iPhone or <strong>three dot (⋮) top right</strong> on Android.</li>
                        <li>Tap <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong>.</li>
                        <li>Point your phone camera at this QR code.</li>
                      </ol>
                    </div>

                  </div>
                )}

                {/* Auto Logout Security Pill */}
                <div className="w-full pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Temporary sandbox session. Automatically logged out upon tab close.
                  </p>
                </div>

              </div>
            )}

            {/* TAB 2: On-Screen Interactive WhatsApp Chat Canvas */}
            {activeTab === "chat" && (
              <div className="w-full max-w-[420px] bg-[#efeae2] rounded-[2.2rem] border-[7px] border-slate-900 shadow-xl overflow-hidden flex flex-col h-[560px] sm:h-[580px] relative animate-in fade-in duration-200">
                
                {/* WhatsApp Official Clean Header */}
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
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                  
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
                </div>

                {/* WhatsApp Light Input Bar */}
                <div className="bg-[#f0f2f5] p-2.5 flex items-center gap-2 shrink-0 border-t border-slate-200">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type patient question in English/Hindi/Hinglish..."
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

          </div>

        </div>
      </div>
    </section>
  );
}
