export interface MedicalStockPhoto {
  id: string;
  title: string;
  url: string;
  category: "HERO" | "DOCTOR" | "CLINIC" | "PEDIATRICS" | "DENTAL" | "DERMATOLOGY" | "CARDIOLOGY" | "ORTHO" | "GENERAL";
  tags: string[];
}

export const MEDICAL_STOCK_PHOTOS: MedicalStockPhoto[] = [
  // 1. PEDIATRICS & CHILD CARE
  {
    id: "ped_1",
    title: "Gentle Pediatrician with Child Patient",
    url: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1200&q=80",
    category: "PEDIATRICS",
    tags: ["pediatrics", "child", "baby", "doctor", "stethoscope", "hero"]
  },
  {
    id: "ped_2",
    title: "Caring Pediatric Consultation & Examination",
    url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
    category: "PEDIATRICS",
    tags: ["pediatrics", "clinic", "child", "vaccination", "baby"]
  },
  {
    id: "ped_3",
    title: "Warm Pediatric Clinic Room with Toys",
    url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80",
    category: "PEDIATRICS",
    tags: ["pediatrics", "clinic", "interior", "child"]
  },

  // 2. DENTAL & SMILE AESTHETICS
  {
    id: "dent_1",
    title: "Modern Dental Examination & Clean Suite",
    url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
    category: "DENTAL",
    tags: ["dental", "dentist", "smile", "teeth", "clinic", "hero"]
  },
  {
    id: "dent_2",
    title: "Confident Healthy Smile Aesthetics",
    url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80",
    category: "DENTAL",
    tags: ["dental", "smile", "cosmetic", "teeth"]
  },
  {
    id: "dent_3",
    title: "Precision Dental Technology & Chair",
    url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
    category: "DENTAL",
    tags: ["dental", "chair", "equipment", "clinic"]
  },

  // 3. DERMATOLOGY & AESTHETICS
  {
    id: "derma_1",
    title: "Professional Dermatological Skin Treatment",
    url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    category: "DERMATOLOGY",
    tags: ["dermatology", "skin", "cosmetic", "glow", "hero"]
  },
  {
    id: "derma_2",
    title: "Luminous Healthy Skin Consultation",
    url: "https://images.unsplash.com/photo-1512290900672-1f02e1c3a647?auto=format&fit=crop&w=1200&q=80",
    category: "DERMATOLOGY",
    tags: ["dermatology", "facial", "skin care", "aesthetic"]
  },
  {
    id: "derma_3",
    title: "Modern Dermatology Clinic Suite",
    url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    category: "DERMATOLOGY",
    tags: ["clinic", "interior", "clean", "aesthetic"]
  },

  // 4. CARDIOLOGY & INTERNAL MEDICINE
  {
    id: "cardio_1",
    title: "Advanced Cardiac Diagnostics & Heart Care",
    url: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80",
    category: "CARDIOLOGY",
    tags: ["cardiology", "heart", "doctor", "stethoscope", "hero"]
  },
  {
    id: "cardio_2",
    title: "Doctor Consulting ECG & Patient Health",
    url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
    category: "CARDIOLOGY",
    tags: ["cardiology", "ecg", "consultation", "doctor"]
  },

  // 5. ORTHOPEDICS & PHYSIOTHERAPY
  {
    id: "ortho_1",
    title: "Active Physical Therapy & Joint Rehabilitation",
    url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    category: "ORTHO",
    tags: ["orthopedics", "physio", "rehab", "spine", "joint", "hero"]
  },
  {
    id: "ortho_2",
    title: "Sports Medicine & Movement Assessment",
    url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=1200&q=80",
    category: "ORTHO",
    tags: ["sports", "physiotherapy", "rehabilitation"]
  },

  // 6. GENERAL CLINIC, RECEPTION & DOCTORS
  {
    id: "gen_1",
    title: "Senior Consultant Doctor in White Coat",
    url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80",
    category: "DOCTOR",
    tags: ["doctor", "portrait", "physician", "consultant", "hero"]
  },
  {
    id: "gen_2",
    title: "Modern Premium Clinic Lounge & Reception",
    url: "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=1200&q=80",
    category: "CLINIC",
    tags: ["clinic", "reception", "waiting room", "interior", "facilities"]
  },
  {
    id: "gen_3",
    title: "High-Tech Diagnostic Clinical Suite",
    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
    category: "CLINIC",
    tags: ["clinic", "laboratory", "equipment", "technology"]
  },
  {
    id: "gen_4",
    title: "Compassionate Doctor Patient Interaction",
    url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80",
    category: "GENERAL",
    tags: ["consultation", "patient", "care", "doctor", "hero"]
  }
];
