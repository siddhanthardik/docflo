export interface ThemePreset {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  buttonRadius: "none" | "md" | "xl" | "2xl" | "full";
  badgeText: string;
  heroHeading: string;
  heroSubheading: string;
  tagline: string;
  specialty: string;
  degrees: string;
  designation: string;
  stats: Array<{ value: string; label: string; icon?: string }>;
  services: Array<{ name: string; description: string; duration?: number | string; price?: number; icon?: string; image?: string }>;
  packages?: Array<{
    name: string;
    tag?: string;
    parameterCount?: string;
    originalPrice?: number;
    price?: number;
    discount?: string;
    fasting?: string;
    reportTime?: string;
    popular?: boolean;
    features?: string[];
  }>;
  faqs: Array<{ question: string; answer: string }>;
  sections: Array<{ id: string; type: string; title?: string; subtitle?: string; badgeText?: string }>;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  "apex-clinical": {
    "id": "apex-clinical",
    "name": "Apex Clinical Pro",
    "category": "Hospital & Polyclinic",
    "primaryColor": "#2563EB",
    "secondaryColor": "#0F172A",
    "accentColor": "#10B981",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "2xl",
    "badgeText": "Multidisciplinary Hospital & Advanced Polyclinic",
    "heroHeading": "Comprehensive Healthcare, Specialized Medicine & Compassionate Care",
    "heroSubheading": "Providing multi-specialty clinical consultations, advanced diagnostics, and dedicated OPD services for your entire family.",
    "tagline": "Dedicated Patient Care",
    "specialty": "Multi-Specialty Clinical Practice",
    "degrees": "MBBS, MD, DNB (Senior Consultant)",
    "designation": "Chief Medical Officer & Medical Director",
    "stats": [
      {
        "value": "15+ Years",
        "label": "Clinical Excellence",
        "icon": "activity"
      },
      {
        "value": "50,000+",
        "label": "Patients Treated",
        "icon": "user"
      },
      {
        "value": "100%",
        "label": "Evidence-Based Care",
        "icon": "shield"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Comprehensive General Medicine",
        "description": "Holistic evaluation, diagnosis, and personalized management for acute illnesses and chronic health conditions.",
        "icon": "stethoscope",
        "duration": "30"
      },
      {
        "name": "Executive Health Checkup",
        "description": "Comprehensive full-body organ profiling, cardiac screening, and preventive health analysis.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Chronic Disease & Diabetes Care",
        "description": "Continuous glycemic monitoring, blood pressure optimization, and lifestyle modification plans.",
        "icon": "heart",
        "duration": "30"
      },
      {
        "name": "Advanced Diagnostic Testing",
        "description": "In-house digital X-ray, ECG, color Doppler ultrasound, and computerized pathology testing.",
        "icon": "shield",
        "duration": "20"
      },
      {
        "name": "Pediatric & Family Healthcare",
        "description": "Newborn screening, vaccination schedules, growth tracking, and compassionate child care.",
        "icon": "baby",
        "duration": "30"
      },
      {
        "name": "Minor Surgical OPD Procedures",
        "description": "Sterile dressing, suture removal, minor excision, and fast-recovery outpatient care.",
        "icon": "bandage",
        "duration": "25"
      }
    ],
    "faqs": [
      {
        "question": "How do I schedule an appointment with a specialist?",
        "answer": "Click the 'Book Appointment' button on the website or message our reception desk on WhatsApp."
      },
      {
        "question": "Are walk-in consultations available?",
        "answer": "Yes, we accept walk-in patients for urgent care, though booking in advance minimizes your waiting time."
      },
      {
        "question": "What diagnostic tests are performed on-site?",
        "answer": "We provide complete automated blood tests, digital X-rays, 12-lead ECGs, and ultrasound scans."
      },
      {
        "question": "Do you accept health insurance and cashless claims?",
        "answer": "Yes, we partner with major insurance TPAs for eligible outpatient diagnostic and day-care procedures."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "ophthalmology-vision": {
    "id": "ophthalmology-vision",
    "name": "Ophthalmology Vision",
    "category": "Eye & Lasik Clinics",
    "primaryColor": "#0369A1",
    "secondaryColor": "#082F49",
    "accentColor": "#06B6D4",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Precision Eye Care & Advanced Lasik Suite",
    "heroHeading": "Crystal Clear Vision with Bladeless Lasik & Micro-Incision Cataract Care",
    "heroSubheading": "Specialized in Contoura Vision Lasik, Premium Multifocal Cataract Surgery, and Diabetic Retina Laser Treatment.",
    "tagline": "Precision Vision & Retina Care",
    "specialty": "Ophthalmologist & Refractive Surgeon",
    "degrees": "MBBS, MS Ophthalmology, Fellow Cornea & Refractive (AIIMS)",
    "designation": "Senior Cataract & Lasik Specialist",
    "stats": [
      {
        "value": "25,000+",
        "label": "Successful Surgeries",
        "icon": "activity"
      },
      {
        "value": "100%",
        "label": "Bladeless Lasik Tech",
        "icon": "shield"
      },
      {
        "value": "20/20",
        "label": "Visual Acuity Goal",
        "icon": "sparkles"
      },
      {
        "value": "4.9 ★",
        "label": "Google Rated Eye Care",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Contoura Vision & Custom Lasik",
        "description": "Bladeless, topography-guided laser refractive correction for spectacle-free sharp vision.",
        "icon": "sparkles",
        "duration": "30"
      },
      {
        "name": "Micro-Incision Cataract Surgery (MICS)",
        "description": "No-stitch, no-injection sutureless phacoemulsification with premium multifocal/toric lens implants.",
        "icon": "shield",
        "duration": "30"
      },
      {
        "name": "Glaucoma Early Detection & OCT Care",
        "description": "Humphrey visual field analysis, pachymetry, and selective laser trabeculoplasty (SLT).",
        "icon": "activity",
        "duration": "30"
      },
      {
        "name": "Diabetic Retinopathy & Retina Lasers",
        "description": "Green laser photocoagulation, anti-VEGF injections, and high-definition macular OCT scans.",
        "icon": "heart",
        "duration": "45"
      },
      {
        "name": "Pediatric Squint & Vision Therapy",
        "description": "Lazy eye (amblyopia) management, computer vision syndrome care, and customized binocular therapy.",
        "icon": "baby",
        "duration": "30"
      },
      {
        "name": "Dry Eye Spa & Meibomian Gland Therapy",
        "description": "Advanced thermal pulsation and intense pulsed light (IPL) for chronic dry, gritty eyes.",
        "icon": "sparkles",
        "duration": "25"
      }
    ],
    "faqs": [
      {
        "question": "Am I a suitable candidate for Contoura Vision Lasik?",
        "answer": "Ideal candidates are 18+ years old with stable refractive power for at least one year. We perform a corneal topography (Pentacam) to confirm suitability."
      },
      {
        "question": "How long is the recovery time after Cataract Surgery?",
        "answer": "Most patients resume normal daily activities within 24 to 48 hours. Micro-incision phaco surgery requires no stitches or bandages."
      },
      {
        "question": "Can diabetic retinopathy cause permanent vision loss if untreated?",
        "answer": "Yes, early laser or anti-VEGF injections prevent irreversible vision loss from diabetic maculopathy."
      },
      {
        "question": "How do I schedule an eye checkup?",
        "answer": "Click 'Book Appointment' or message our optical care reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "serene-glow": {
    "id": "serene-glow",
    "name": "Serene Glow Haute",
    "category": "Dermatology & Skin",
    "primaryColor": "#BE185D",
    "secondaryColor": "#1E1B4B",
    "accentColor": "#F43F5E",
    "fontHeading": "Playfair Display",
    "fontBody": "Plus Jakarta Sans",
    "buttonRadius": "2xl",
    "badgeText": "US-FDA Approved Aesthetic Dermatology & Cosmetology",
    "heroHeading": "Radiant Skin, Timeless Aesthetics & Advanced Hair Rejuvenation",
    "heroSubheading": "Bespoke aesthetic protocols combining medical dermatology, HydraFacial MD, and US-FDA laser technologies.",
    "tagline": "Bespoke Aesthetic Dermatology",
    "specialty": "Consultant Dermatologist & Cosmetologist",
    "degrees": "MBBS, MD Dermatology, Fellow Aesthetic Medicine (FAM)",
    "designation": "Director of Clinical Cosmetology",
    "stats": [
      {
        "value": "12,000+",
        "label": "Aesthetic Procedures",
        "icon": "sparkles"
      },
      {
        "value": "100%",
        "label": "US-FDA Approved Tech",
        "icon": "shield"
      },
      {
        "value": "99.2%",
        "label": "Client Satisfaction",
        "icon": "heart"
      },
      {
        "value": "4.9 ★",
        "label": "Google Glow Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Medical HydraFacial MD & Glow Therapy",
        "description": "Vortex-cleansing, deep extraction, and intense hydration infused with medical antioxidant serums.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Painless Diode Laser Hair Reduction",
        "description": "Triple-wavelength cooled laser for permanent hair reduction across all skin tones.",
        "icon": "shield",
        "duration": "30"
      },
      {
        "name": "Acne Scar Resurfacing (Fractional CO2)",
        "description": "Advanced collagen induction therapy with Microneedling RF and subcision.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Hair PRP & Growth Factor Concentrate (GFC)",
        "description": "High-concentration autologous growth factors to halt hair thinning and stimulate follicle regrowth.",
        "icon": "activity",
        "duration": "40"
      },
      {
        "name": "Anti-Aging Botox, Fillers & Skin Boosters",
        "description": "Natural contour refinement, fine-line reduction, and deep hyaluronic acid bio-remodeling.",
        "icon": "heart",
        "duration": "30"
      },
      {
        "name": "Advanced Chemical Peels & Pigmentation",
        "description": "Targeted dermatological peels for melasma, tanning, dark circles, and sun damage.",
        "icon": "sparkles",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "Is HydraFacial suitable for sensitive or acne-prone skin?",
        "answer": "Yes, HydraFacial MD is fully customizable with gentle, non-irritating exfoliation tips and calming hyaluronic acid."
      },
      {
        "question": "How many laser hair reduction sessions are needed?",
        "answer": "Typically 6 to 8 sessions spaced 4 to 6 weeks apart achieve 85-95% permanent hair reduction."
      },
      {
        "question": "How quickly do Botox and Dermal Fillers show results?",
        "answer": "Dermal Fillers show immediate restoration, while Botox relaxation peaks between 5 to 7 days."
      },
      {
        "question": "How do I book a skin analysis?",
        "answer": "Click 'Book Appointment' or message our aesthetic desk directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "minimal-luxe": {
    "id": "minimal-luxe",
    "name": "Minimal Cyan Precision",
    "category": "Dentistry & Smile",
    "primaryColor": "#0284C7",
    "secondaryColor": "#0F172A",
    "accentColor": "#14B8A6",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Digital 3D Dentistry & Painless Laser Smile Design",
    "heroHeading": "Transform Your Smile with Invisible Aligners, Dental Implants & Painless Care",
    "heroSubheading": "Experience next-generation dental medicine with 3D intraoral scanning, single-sitting root canals, and computer-guided implants.",
    "tagline": "Precision Dental Excellence",
    "specialty": "Cosmetic Dentist & Implantologist",
    "degrees": "BDS, MDS Orthodontics & Implantology, Fellow ICOI",
    "designation": "Chief Dental Surgeon & Smile Architect",
    "stats": [
      {
        "value": "15,000+",
        "label": "Smiles Restored",
        "icon": "sparkles"
      },
      {
        "value": "100%",
        "label": "Painless Single-Visit RCT",
        "icon": "shield"
      },
      {
        "value": "3D Digital",
        "label": "Intraoral Scanning",
        "icon": "activity"
      },
      {
        "value": "4.9 ★",
        "label": "Google Smile Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Clear Invisible Teeth Aligners",
        "description": "Discreet orthodontic alignment with 3D AI treatment simulation and comfortable clear trays.",
        "icon": "sparkles",
        "duration": "30"
      },
      {
        "name": "Painless Single-Sitting Root Canal (RCT)",
        "description": "Rotary endodontics with apex locator precision and biocompatible bioceramic sealing.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Computer-Guided Dental Implants",
        "description": "Titanium implants placed with 3D surgical guides for lifetime stability and natural chewing.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Laser Teeth Whitening & Smile Makeover",
        "description": "In-office cold laser whitening for 6-8 shades brighter teeth in a single 45-minute visit.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Full Ceramic & Zirconia CAD/CAM Crowns",
        "description": "Metal-free, unbreakable zirconia crowns custom-milled with sub-micron precision.",
        "icon": "shield",
        "duration": "30"
      },
      {
        "name": "Pediatric Dentistry & Preventive Care",
        "description": "Gentle fluoridation, pit & fissure sealants, and painless space maintainers for children.",
        "icon": "baby",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "Are clear aligners as effective as traditional metal braces?",
        "answer": "Yes, modern 3D aligners treat crowding, gaps, and overbites effectively with faster hygiene and zero food restrictions."
      },
      {
        "question": "Is a root canal treatment painful?",
        "answer": "Not at all. With modern computer-controlled local anesthesia and rotary technology, RCT is completely painless."
      },
      {
        "question": "How long do dental implants last?",
        "answer": "With good oral hygiene, dental implants integrate permanently into your jawbone and can last a lifetime."
      },
      {
        "question": "How do I schedule a smile consultation?",
        "answer": "Click 'Book Appointment' or message our dental reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "warm-pediatrics": {
    "id": "warm-pediatrics",
    "name": "Warm Family & Kids",
    "category": "Pediatrics & Child Care",
    "primaryColor": "#059669",
    "secondaryColor": "#0F172A",
    "accentColor": "#F59E0B",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "full",
    "badgeText": "🧸 Kid-Friendly Stress-Free Clinic • WHO & IAP Vaccinations • Newborn & Child Care",
    "heroHeading": "Gentle, Loving Healthcare for Happy, Healthy & Thriving Kids",
    "heroSubheading": "Expert pediatric consultations, pain-minimized vaccinations, growth milestone tracking, and 24/7 fever care in a warm, stress-free, kid-friendly clinic.",
    "tagline": "Gentle Care for Little Smiles",
    "specialty": "Consultant Pediatrician & Neonatologist",
    "degrees": "MBBS, MD Pediatrics, DNB (Peds), Fellow Neonatal Medicine (IAP)",
    "designation": "Head of Pediatric & Neonatal Medicine",
    "stats": [
      {
        "value": "20,000+",
        "label": "Happy Kids Treated",
        "icon": "baby"
      },
      {
        "value": "100%",
        "label": "Pain-Minimizing Vaccines",
        "icon": "shield"
      },
      {
        "value": "0 - 18 Yrs",
        "label": "Newborn to Teen Health",
        "icon": "activity"
      },
      {
        "value": "4.9 ★",
        "label": "Parent & Family Trust",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Newborn & Neonatal Care (0-12 Months)",
        "description": "Gentle health assessments, newborn jaundice monitoring, feeding/lactation support, and neonatal screening.",
        "icon": "baby",
        "duration": "30"
      },
      {
        "name": "Painless IAP & WHO Vaccination Suite",
        "description": "100% cold-chain preserved vaccines with pain-minimizing fine needles, distraction toys, and digital vaccine tracker.",
        "icon": "shield",
        "duration": "20"
      },
      {
        "name": "Growth, Nutrition & Milestone Tracking",
        "description": "Detailed tracking of height, weight, speech, and motor milestones with personalized pediatric diet plans for picky eaters.",
        "icon": "activity",
        "duration": "30"
      },
      {
        "name": "Pediatric Allergy, Asthma & Nebulization",
        "description": "Child-friendly diagnostic care and low-stress inhalation therapy for recurrent cough, wheezing, and seasonal allergies.",
        "icon": "heart",
        "duration": "30"
      },
      {
        "name": "Childhood Infections & Acute Fever Clinic",
        "description": "Same-day rapid diagnosis and gentle treatment for acute fevers, flu, stomach bugs, ear pain, and throat infections.",
        "icon": "bandage",
        "duration": "20"
      },
      {
        "name": "Pediatric Gut Health & Constipation Clinic",
        "description": "Non-invasive care for chronic constipation, infant colic, tummy aches, acid reflux, and childhood food intolerances.",
        "icon": "shield",
        "duration": "25"
      },
      {
        "name": "Childhood Skin, Eczema & Rash Care",
        "description": "Targeted pediatric dermatological care for infant atopic dermatitis, diaper rashes, heat rashes, and childhood viral rashes.",
        "icon": "sparkles",
        "duration": "25"
      },
      {
        "name": "Adolescent Health, Puberty & Behavioral Care",
        "description": "Empathetic counseling for school stress, pubertal growth, ADHD screening, and adolescent lifestyle guidance.",
        "icon": "sparkles",
        "duration": "35"
      }
    ],
    "faqs": [
      {
        "question": "How does the clinic ensure a stress-free and pain-minimized vaccination experience?",
        "answer": "We use ultra-fine needles, specialized skin-numbing techniques, child distraction toys, and a warm, cheerful play area so your child feels safe and happy rather than fearful."
      },
      {
        "question": "What should I do immediately if my baby runs a high fever at night?",
        "answer": "Keep your baby calm and hydrated in light cotton clothes, gently sponge forehead and limbs with lukewarm water (never cold water), and consult our pediatrician via WhatsApp for age-exact paracetamol dosage."
      },
      {
        "question": "What if my child missed a scheduled vaccination date?",
        "answer": "Don't worry! Most missed vaccines can be safely administered via a personalized IAP 'catch-up' immunization schedule without restarting the series."
      },
      {
        "question": "When should I schedule developmental milestone checks?",
        "answer": "Key milestone evaluations are recommended at 6 weeks, 3 months, 6 months, 9 months, 12 months, 18 months, and annually thereafter."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "vitality-rehab": {
    "id": "vitality-rehab",
    "name": "Vitality Active Carbon",
    "category": "Ortho & Physio",
    "primaryColor": "#0D9488",
    "secondaryColor": "#18181B",
    "accentColor": "#E11D48",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Robotic Joint Replacement & Advanced Sports Injury Rehab",
    "heroHeading": "Robotic Joint Replacement, Spine Care & Sports Injury Rehabilitation",
    "heroSubheading": "Restoring pain-free mobility with minimally invasive arthroscopy, robotic knee replacement, and personalized physical therapy.",
    "tagline": "Joint & Mobility Excellence",
    "specialty": "Orthopedic Surgeon & Joint Specialist",
    "degrees": "MBBS, MS Orthopedics, DNB, Fellow Joint Replacement (UK)",
    "designation": "Chief of Orthopedic & Sports Medicine",
    "stats": [
      {
        "value": "10,000+",
        "label": "Joint Surgeries & Rehabs",
        "icon": "activity"
      },
      {
        "value": "100%",
        "label": "Robotic & Keyhole Tech",
        "icon": "shield"
      },
      {
        "value": "98.6%",
        "label": "Mobility Restoration Rate",
        "icon": "sparkles"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Robotic Total Knee & Hip Replacement",
        "description": "Sub-millimeter robotic precision for faster recovery, minimal blood loss, and natural joint feeling.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Arthroscopic Keyhole Surgery (ACL & Meniscus)",
        "description": "Minimally invasive ligament repair and rotator cuff reconstruction with same-day discharge.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Comprehensive Spine Care & Slipped Disc",
        "description": "Non-surgical decompression and targeted spinal physical rehabilitation.",
        "icon": "heart",
        "duration": "30"
      },
      {
        "name": "Sports Injury Rehab & Gait Analysis",
        "description": "Customized athletic recovery protocols, biomechanical gait analysis, and strength conditioning.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Advanced Electrotherapy & Dry Needling",
        "description": "Targeted pain relief using class-IV laser therapy, ultrasonic therapy, and trigger point release.",
        "icon": "sparkles",
        "duration": "30"
      },
      {
        "name": "Fracture & Trauma Management",
        "description": "Rigid anatomic fixation, plaster casting, and post-fracture joint mobilization.",
        "icon": "bandage",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "How soon can I walk after Robotic Knee Replacement?",
        "answer": "Most patients stand and walk with support within 4 to 6 hours after surgery and climb stairs within 48 hours."
      },
      {
        "question": "Can knee arthritis be treated without surgery?",
        "answer": "Yes, early to moderate osteoarthritis can be managed with hyaluronic acid injections, PRP therapy, and physiotherapy."
      },
      {
        "question": "What is the recovery period after ACL reconstruction?",
        "answer": "Athletic return takes 6 to 9 months of structured rehabilitation, while desk work resumes in 2 to 3 weeks."
      },
      {
        "question": "How do I schedule an orthopedic consultation?",
        "answer": "Click 'Book Appointment' or message our joint care reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "ayurveda-earth": {
    "id": "ayurveda-earth",
    "name": "Ayurveda & Holistic Earth",
    "category": "Wellness & Integrative",
    "primaryColor": "#854D0E",
    "secondaryColor": "#1C1917",
    "accentColor": "#15803D",
    "fontHeading": "Lora",
    "fontBody": "Plus Jakarta Sans",
    "buttonRadius": "xl",
    "badgeText": "Authentic Classical Panchakarma & Pulse Diagnosis (Nadi Pariksha)",
    "heroHeading": "Classical Ayurveda, Authentic Panchakarma & Root-Cause Healing",
    "heroSubheading": "Restore natural harmony with customized herbal formulations, classical detoxification therapies, and lifestyle guidance.",
    "tagline": "Holistic Herbal Wellness",
    "specialty": "Ayurvedic Physician & Panchakarma Specialist",
    "degrees": "BAMS, MD Ayurveda, Nadi Pariksha Acharya",
    "designation": "Senior Vaidya & Medical Director",
    "stats": [
      {
        "value": "100%",
        "label": "Pure Classical Herbals",
        "icon": "leaf"
      },
      {
        "value": "18,000+",
        "label": "Patients Healed Naturally",
        "icon": "heart"
      },
      {
        "value": "3 Doshas",
        "label": "Nadi Imbalance Diagnosis",
        "icon": "sparkles"
      },
      {
        "value": "4.9 ★",
        "label": "Google Holistic Rated",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Authentic Panchakarma Detoxification",
        "description": "Full 5-fold classical body cleansing including Vamana, Virechana, Basti, and Nasya.",
        "icon": "leaf",
        "duration": "60"
      },
      {
        "name": "Nadi Pariksha & Dosha Analysis",
        "description": "Ancient Ayurvedic pulse diagnosis to identify root-cause imbalances across Vata, Pitta, and Kapha.",
        "icon": "activity",
        "duration": "30"
      },
      {
        "name": "Shirodhara & Stress Relief Therapy",
        "description": "Continuous warm medicated herbal oil pouring on the third-eye chakra for anxiety and insomnia.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Kati Basti & Janu Basti (Joint Care)",
        "description": "Warm herbal oil reservoirs for chronic lower back pain, sciatica, and knee arthritis.",
        "icon": "heart",
        "duration": "45"
      },
      {
        "name": "Herbal Udvartana & Metabolism Scrub",
        "description": "Exfoliating herbal powder deep-tissue massage to stimulate lymphatic flow and reduce body fat.",
        "icon": "leaf",
        "duration": "45"
      },
      {
        "name": "Chronic Disease & Autoimmune Protocol",
        "description": "Root-cause integrative herbal therapy for digestive disorders (IBS), skin psoriasis, and thyroid.",
        "icon": "shield",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "How many days does a complete Panchakarma detox take?",
        "answer": "A full classical Panchakarma program ranges from 7, 14, to 21 days depending on your individual health condition and dosha constitution."
      },
      {
        "question": "Are Ayurvedic herbal medicines safe for long-term use?",
        "answer": "Yes, when prescribed by a qualified BAMS/MD Ayurvedic physician, authentic herbal formulations are natural and non-habit forming."
      },
      {
        "question": "Can I take Ayurvedic medicines alongside allopathic prescriptions?",
        "answer": "Yes, in most cases Ayurvedic therapies complement modern treatments. Our Vaidya reviews your ongoing medications for safe synergy."
      },
      {
        "question": "How do I schedule a Nadi Pariksha consultation?",
        "answer": "Click 'Book Appointment' or message our Ayurvedic clinic reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "cardiocare-executive": {
    "id": "cardiocare-executive",
    "name": "CardioCare Executive",
    "category": "Cardiology & Vascular",
    "primaryColor": "#DC2626",
    "secondaryColor": "#0F172A",
    "accentColor": "#E11D48",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Advanced Interventional Cardiology & 24/7 Chest Pain Protocol",
    "heroHeading": "Precision Cardiology, Advanced Heart Diagnostics & Interventional Care",
    "heroSubheading": "Led by senior DM interventional cardiologists offering complete 3D Echocardiography, TMT stress testing, and preventive cardiac wellness.",
    "tagline": "Precision Heart & Vascular Care",
    "specialty": "Interventional Cardiologist",
    "degrees": "MBBS, MD Medicine, DM Cardiology, Fellow ACC / FSCAI",
    "designation": "Director of Interventional Cardiology",
    "stats": [
      {
        "value": "15,000+",
        "label": "Angiographies & Stenting",
        "icon": "heart"
      },
      {
        "value": "100%",
        "label": "Cath-Lab Precision Standards",
        "icon": "shield"
      },
      {
        "value": "<30 min",
        "label": "Door-to-Balloon Rapid Care",
        "icon": "clock"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Comprehensive 3D Color Doppler 2D Echo",
        "description": "Detailed real-time assessment of heart chambers, ejection fraction, and cardiac valve function.",
        "icon": "heart",
        "duration": "30"
      },
      {
        "name": "Treadmill Stress Test (TMT) & 24-hr Holter",
        "description": "Computerized exercise ECG and 24/48-hour continuous ambulatory rhythm monitoring.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Coronary Angiography & Radial Stenting",
        "description": "Painless wrist-access (transradial) coronary angiography and drug-eluting stent implantation.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Pacemaker & Arrhythmia Management",
        "description": "Advanced leadless pacemaker insertion, biventricular CRT, and arrhythmia management.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Executive Preventive Cardiac Health Suite",
        "description": "Lipid profile, HbA1c, high-sensitivity Troponin-I, CT coronary calcium score, and diet coaching.",
        "icon": "sparkles",
        "duration": "60"
      },
      {
        "name": "Hypertension & Heart Failure Management",
        "description": "Tailored medication titration, fluid retention monitoring, and long-term cardiac rehabilitation.",
        "icon": "heart",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "What are the critical early warning signs of a heart attack?",
        "answer": "Pressure, tightness, or squeezing pain in the center of the chest spreading to the left arm, neck, or jaw, accompanied by shortness of breath or cold sweating."
      },
      {
        "question": "How should I prepare for a Treadmill Stress Test (TMT)?",
        "answer": "Wear comfortable walking shoes. Avoid heavy meals or caffeine 3 hours before the test."
      },
      {
        "question": "Why is wrist (transradial) angiography preferred?",
        "answer": "Transradial access through the wrist results in virtually zero bleeding complications and allows same-day discharge."
      },
      {
        "question": "How do I schedule an executive heart checkup?",
        "answer": "Click 'Book Appointment' or message our cardiology desk directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "neuropsych-horizon": {
    "id": "neuropsych-horizon",
    "name": "NeuroPsych Horizon",
    "category": "Mental & Neurology",
    "primaryColor": "#7C3AED",
    "secondaryColor": "#1E1B4B",
    "accentColor": "#A855F7",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "100% Confidential Psychological Care & Advanced Neuro Diagnostics",
    "heroHeading": "Advanced Neurology, Compassionate Psychiatry & Mind Wellness",
    "heroSubheading": "Comprehensive clinical neurology, EEG/EMG diagnostics, and evidence-based psychotherapy in a supportive, judgment-free environment.",
    "tagline": "Empathetic Brain & Mental Health",
    "specialty": "Neurologist & Neuro-Psychiatrist",
    "degrees": "MBBS, MD Psychiatry / DM Neurology, DNB, Fellow IPS",
    "designation": "Consultant Neurologist & Mind Specialist",
    "stats": [
      {
        "value": "100%",
        "label": "Confidential & Private",
        "icon": "shield"
      },
      {
        "value": "14,000+",
        "label": "Lives Guided & Restored",
        "icon": "brain"
      },
      {
        "value": "Digital",
        "label": "Video EEG & EMG Studies",
        "icon": "activity"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Digital Video EEG & Epilepsy Care",
        "description": "32-channel video electroencephalogram mapping for seizures, fainting spells, and epilepsy.",
        "icon": "brain",
        "duration": "45"
      },
      {
        "name": "Migraine, Headache & Vertigo Clinic",
        "description": "Targeted nerve block injections, vestibular rehabilitation, and prophylactic migraine protocols.",
        "icon": "activity",
        "duration": "30"
      },
      {
        "name": "Evidence-Based Psychotherapy & CBT",
        "description": "Structured psychotherapy for anxiety, panic attacks, OCD, depression, and trauma recovery.",
        "icon": "heart",
        "duration": "50"
      },
      {
        "name": "Stroke Rehab & Nerve Studies (EMG/NCV)",
        "description": "Electromyography, nerve conduction studies, and multidisciplinary motor rehabilitation.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Sleep Disorder & Insomnia Diagnostic Suite",
        "description": "Polysomnography sleep apnea evaluation and non-pharmacological sleep hygiene therapy.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Memory & Movement Disorders (Parkinson's)",
        "description": "Neurocognitive profiling, tremor management, and comprehensive caregiver support programs.",
        "icon": "brain",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "Are therapy and psychiatry sessions strictly confidential?",
        "answer": "Yes, absolute patient confidentiality is guaranteed. All clinical records and consultations are strictly protected."
      },
      {
        "question": "Are psychiatric medications safe and addictive?",
        "answer": "Modern psychiatric medications (like SSRIs) prescribed for depression and anxiety are non-addictive and carefully monitored with periodic clinical reviews."
      },
      {
        "question": "When should I consult a Neurologist versus a Psychiatrist?",
        "answer": "Neurologists diagnose physical conditions of the brain/nerves (stroke, epilepsy, tremors), while Psychiatrists specialize in mental and emotional wellness."
      },
      {
        "question": "How do I schedule a confidential consultation?",
        "answer": "Click 'Book Appointment' or message our mental health reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "executive-private": {
    "id": "executive-private",
    "name": "Executive Private Practice",
    "category": "VIP Concierge Suites",
    "primaryColor": "#CA8A04",
    "secondaryColor": "#0A0A0A",
    "accentColor": "#EAB308",
    "fontHeading": "Playfair Display",
    "fontBody": "Plus Jakarta Sans",
    "buttonRadius": "xl",
    "badgeText": "Bespoke VIP Healthcare & Direct Senior Physician Access",
    "heroHeading": "Bespoke Executive Healthcare, Private Medical Concierge & Preventive Longevity",
    "heroSubheading": "Unparalleled personalized medical attention with zero waiting time, dedicated private consultation suites, and 24/7 direct physician communication.",
    "tagline": "VIP Medical Concierge",
    "specialty": "Executive Private Physician & Longevity Advisor",
    "degrees": "MBBS, MD, MRCP (UK), FACP (USA)",
    "designation": "Medical Director & Private Concierge",
    "stats": [
      {
        "value": "Zero",
        "label": "Waiting Time Guaranteed",
        "icon": "crown"
      },
      {
        "value": "1-on-1",
        "label": "Dedicated Senior Physician",
        "icon": "shield"
      },
      {
        "value": "24/7",
        "label": "Direct Concierge Access",
        "icon": "phone"
      },
      {
        "value": "5.0 ★",
        "label": "Executive Client Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Executive Longevity & Biomarker Screening",
        "description": "Full-body organ profiling, advanced genetic markers, cardiac CT score, and anti-aging biomarker analysis.",
        "icon": "crown",
        "duration": "60"
      },
      {
        "name": "Private Medical Concierge & Priority VIP Suite",
        "description": "Seamless coordination of world-class specialist second opinions, private VIP suites, and priority care.",
        "icon": "shield",
        "duration": "60"
      },
      {
        "name": "Personalized Preventive Medicine & Metabolism",
        "description": "Customized bio-identical hormone profiling, nutritional genomics, and continuous metabolic monitoring.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Bespoke Family Health Advisory & Direct Access",
        "description": "Dedicated private family physician with direct 24/7 WhatsApp access, home visits, and care coordination.",
        "icon": "heart",
        "duration": "45"
      },
      {
        "name": "Executive Stress, Sleep & Cognitive Boost",
        "description": "Neuro-feedback monitoring, circadian rhythm optimization, and executive burnout recovery protocols.",
        "icon": "brain",
        "duration": "45"
      },
      {
        "name": "Global Medical Second Opinions & Concierge",
        "description": "Direct case review by world-leading international medical specialists and cross-border coordination.",
        "icon": "crown",
        "duration": "60"
      }
    ],
    "faqs": [
      {
        "question": "How does the VIP Medical Concierge model work?",
        "answer": "Our practice limits total client enrollment to ensure immediate, unhurried, same-day access with direct 24/7 personal communication with your senior physician."
      },
      {
        "question": "How long are private consultation appointments?",
        "answer": "Each private executive consultation is scheduled for 45 to 60 minutes, ensuring exhaustive discussion of your health and longevity goals."
      },
      {
        "question": "How is absolute privacy and discretion maintained?",
        "answer": "We provide private entrance access, dedicated private suites, zero waiting room overlap, and stringent VIP confidentiality protocols."
      },
      {
        "question": "How do I reserve a private consultation suite?",
        "answer": "Click 'Book Appointment' or connect directly with our medical concierge on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "blossom-gynae": {
    "id": "blossom-gynae",
    "name": "Blossom Gynae & Maternity",
    "category": "Gynecology & Fertility",
    "primaryColor": "#E11D48",
    "secondaryColor": "#1E1B4B",
    "accentColor": "#FB7185",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "2xl",
    "badgeText": "Compassionate Care Across Every Stage of Womanhood & Motherhood",
    "heroHeading": "Compassionate Gynecology, Advanced Maternity & Fertility Care",
    "heroSubheading": "Providing expert prenatal care, painless normal deliveries, advanced laparoscopic surgery, and personalized fertility solutions.",
    "tagline": "Women & Maternity Healthcare",
    "specialty": "Consultant Obstetrician & Gynecologist",
    "degrees": "MBBS, MS (OBG), DNB, Fellow Laparoscopic Surgery & Infertility",
    "designation": "Senior Consultant Gynecologist",
    "stats": [
      {
        "value": "12,000+",
        "label": "Healthy Deliveries & Babies",
        "icon": "baby"
      },
      {
        "value": "100%",
        "label": "Advanced 3D/4D Fetal Scans",
        "icon": "activity"
      },
      {
        "value": "98%",
        "label": "Normal Delivery Preference",
        "icon": "heart"
      },
      {
        "value": "4.9 ★",
        "label": "Mother Trust Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Antenatal Care & High-Risk Pregnancy",
        "description": "Trimester-wise pregnancy scans, fetal growth monitoring, and painless normal delivery management.",
        "icon": "baby",
        "duration": "30"
      },
      {
        "name": "PCOS, PCOD & Hormonal Health",
        "description": "Root-cause metabolic profiling, cycle regularization, weight management, and lifestyle coaching.",
        "icon": "heart",
        "duration": "30"
      },
      {
        "name": "Infertility Assessment & IVF Guidance",
        "description": "Ovulation tracking, hormonal evaluation, tubal patency testing, and personalized fertility roadmap.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Laparoscopic Keyhole Gynae Surgery",
        "description": "Keyhole removal of ovarian cysts, fibroids, endometriosis, and uterine polyps with rapid recovery.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Menopause & Cervical Cancer Screening",
        "description": "HPV screening, Pap smear, cervical cancer vaccination, bone density support, and hormone balance.",
        "icon": "activity",
        "duration": "30"
      },
      {
        "name": "Adolescent Period Health & Counseling",
        "description": "Gentle consultation for irregular cycles, severe menstrual pain (dysmenorrhea), and pubertal health.",
        "icon": "sparkles",
        "duration": "25"
      }
    ],
    "faqs": [
      {
        "question": "How do I prepare for a painless normal delivery?",
        "answer": "Our maternity care includes prenatal pelvic floor conditioning, breathing exercises, birth plan consultations, and 24/7 labor suite monitoring with optional epidural analgesia."
      },
      {
        "question": "Can PCOS and irregular cycles be treated naturally?",
        "answer": "Yes, with customized nutritional lifestyle plans, insulin-sensitization therapy, and hormonal balancing, PCOS symptoms can be effectively managed."
      },
      {
        "question": "When should I schedule my first pregnancy ultrasound scan?",
        "answer": "The first dating ultrasound is typically scheduled between 6 to 8 weeks to confirm gestational sac, embryo heartbeat, and accurate due date."
      },
      {
        "question": "How do I schedule an appointment with the gynecologist?",
        "answer": "Click 'Book Appointment' or message our women's health reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "sculpt-aesthetics": {
    "id": "sculpt-aesthetics",
    "name": "Sculpt Luxe Aesthetics",
    "category": "Plastic & Cosmetic Surgery",
    "primaryColor": "#9D174D",
    "secondaryColor": "#09090B",
    "accentColor": "#D97706",
    "fontHeading": "Playfair Display",
    "fontBody": "Plus Jakarta Sans",
    "buttonRadius": "xl",
    "badgeText": "Board-Certified Plastic Surgery & Natural Aesthetic Refinement",
    "heroHeading": "Precision Plastic Surgery, Facial Harmonization & Body Sculpting",
    "heroSubheading": "Combining master surgical artistry with advanced minimally invasive technology to deliver natural, timeless aesthetic transformations.",
    "tagline": "Aesthetic Surgical Artistry",
    "specialty": "Board-Certified Plastic & Cosmetic Surgeon",
    "degrees": "MBBS, MS General Surgery, MCh Plastic Surgery, Fellow ISAPS",
    "designation": "Chief Aesthetic Plastic Surgeon",
    "stats": [
      {
        "value": "8,500+",
        "label": "Aesthetic Transformations",
        "icon": "sparkles"
      },
      {
        "value": "100%",
        "label": "Board-Certified MCh Surgeons",
        "icon": "shield"
      },
      {
        "value": "3D",
        "label": "Vectra 3D Simulation",
        "icon": "activity"
      },
      {
        "value": "4.9 ★",
        "label": "Global Patient Rating",
        "icon": "crown"
      }
    ],
    "services": [
      {
        "name": "HD Liposuction & 360° Body Contouring",
        "description": "VASER ultrasound-assisted fat sculpting, natural muscle definition, and body sculpting.",
        "icon": "sparkles",
        "duration": "60"
      },
      {
        "name": "Preservation Rhinoplasty (Nose Reshaping)",
        "description": "Preservation and structural open/closed rhinoplasty for natural facial balance and clear airway.",
        "icon": "activity",
        "duration": "60"
      },
      {
        "name": "Breast Augmentation, Reduction & Lift",
        "description": "US-FDA approved cohesive silicone implants, composite fat grafting, and natural proportions.",
        "icon": "heart",
        "duration": "60"
      },
      {
        "name": "Deep Plane Facelift & Blepharoplasty",
        "description": "Sub-SMAS facial tightening, neck lift, and eyelid rejuvenation for natural youthful restoration.",
        "icon": "sparkles",
        "duration": "60"
      },
      {
        "name": "Gynecomastia Correction (Male Chest)",
        "description": "Painless gland excision combined with micro-liposuction for an athletic masculine contour.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Mommy Makeover & Tummy Tuck",
        "description": "Diastasis recti muscle repair, excess skin removal, and comprehensive post-pregnancy rejuvenation.",
        "icon": "crown",
        "duration": "60"
      }
    ],
    "faqs": [
      {
        "question": "What is the typical recovery timeline after Rhinoplasty?",
        "answer": "Most external swelling subsides within 7 to 10 days when the nasal splint is removed. You can return to work in 10 to 14 days."
      },
      {
        "question": "Will surgical scars be visible after cosmetic surgery?",
        "answer": "Board-certified plastic surgeons place incisions in natural skin creases or hairline. With micro-suturing, scars fade into subtle, barely noticeable lines."
      },
      {
        "question": "How does 3D Vectra simulation help before surgery?",
        "answer": "3D Vectra imaging captures a precise 3D model of your face/body to preview simulated surgical outcomes before entering the operating room."
      },
      {
        "question": "How do I schedule a private aesthetic consultation?",
        "answer": "Click 'Book Appointment' or message our private surgical coordinator directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "zenith-internal-medicine": {
    "id": "zenith-internal-medicine",
    "name": "Zenith Internal Medicine",
    "category": "General Physician & Internal Medicine",
    "primaryColor": "#1E3A8A",
    "secondaryColor": "#0F172A",
    "accentColor": "#10B981",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Comprehensive Adult Healthcare & Chronic Disease Reversal",
    "heroHeading": "Expert Internal Medicine, Diabetes Care & Comprehensive Primary Healthcare",
    "heroSubheading": "Led by experienced MD Consultant Physicians providing evidence-based diagnosis, chronic disease management, and preventive adult wellness.",
    "tagline": "Comprehensive Internal Medicine",
    "specialty": "Consultant Physician & Diabetologist",
    "degrees": "MBBS, MD General Medicine, DNB, Fellow Indian College of Physicians",
    "designation": "Senior Consultant Physician",
    "stats": [
      {
        "value": "30,000+",
        "label": "Patients Treated & Guided",
        "icon": "user"
      },
      {
        "value": "100%",
        "label": "Evidence-Based Protocols",
        "icon": "shield"
      },
      {
        "value": "Same-Day",
        "label": "OPD & Lab Report Review",
        "icon": "clock"
      },
      {
        "value": "4.9 ★",
        "label": "Google Verified Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Diabetes Management & HbA1c Reversal",
        "description": "Comprehensive blood sugar profiling, insulin titration, dietary planning, and diabetic care screening.",
        "icon": "activity",
        "duration": "30"
      },
      {
        "name": "Hypertension & Cardiac Risk Prevention",
        "description": "Ambulatory blood pressure monitoring, ECG, lipid management, and stroke prevention.",
        "icon": "heart",
        "duration": "30"
      },
      {
        "name": "Thyroid & Metabolic Hormonal Profiling",
        "description": "Precision TSH, Free T3/T4 evaluation, metabolic optimization, and thyroid nodule management.",
        "icon": "sparkles",
        "duration": "30"
      },
      {
        "name": "Acute Fever & Infectious Disease Clinic",
        "description": "Rapid diagnosis and treatment of dengue, malaria, typhoid, seasonal viral infections, and chest flu.",
        "icon": "thermometer",
        "duration": "20"
      },
      {
        "name": "Gastrointestinal Health & Fatty Liver Care",
        "description": "Advanced acidity, IBS, abdominal pain, liver function testing, and fatty liver reversal protocols.",
        "icon": "shield",
        "duration": "30"
      },
      {
        "name": "Annual Adult Preventive Health Checkup",
        "description": "Full-body organ profiling, adult flu/pneumococcal vaccines, and proactive health maintenance.",
        "icon": "stethoscope",
        "duration": "45"
      }
    ],
    "faqs": [
      {
        "question": "What is an ideal target HbA1c level for diabetes management?",
        "answer": "For most non-pregnant adults with diabetes, a general target HbA1c is below 7.0%, while an individualized target is personalized based on clinical profile."
      },
      {
        "question": "Can high blood pressure be managed without lifelong medication?",
        "answer": "Early-stage hypertension can frequently be reversed or controlled with dietary sodium reduction, regular exercise, and weight management."
      },
      {
        "question": "When should I consult a physician for a fever?",
        "answer": "Seek prompt medical consultation if a fever exceeds 101°F (38.3°C), persists for more than 48 hours, or is accompanied by severe headache or rash."
      },
      {
        "question": "How do I schedule an appointment with the consultant physician?",
        "answer": "Click 'Book Appointment' or message our clinic OPD reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "nutrilife-dietetics": {
    "id": "nutrilife-dietetics",
    "name": "NutriLife Dietetics",
    "category": "Dietitian & Clinical Nutrition",
    "primaryColor": "#16A34A",
    "secondaryColor": "#1C1917",
    "accentColor": "#D97706",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Outfit",
    "buttonRadius": "2xl",
    "badgeText": "Certified Clinical Nutrition & Sustainable No-Starvation Diets",
    "heroHeading": "Clinical Nutrition, Sustainable Fat Loss & Metabolic Reversal",
    "heroSubheading": "Personalized meal plans, gut-health optimization, and evidence-based medical nutrition therapy tailored to your lifestyle—without crash diets.",
    "tagline": "Clinical Nutrition & Wellness",
    "specialty": "Registered Dietitian & Clinical Nutritionist",
    "degrees": "M.Sc Clinical Nutrition & Dietetics, RD, Certified Diabetes Educator",
    "designation": "Chief Clinical Nutritionist",
    "stats": [
      {
        "value": "10,000+",
        "label": "Lbs Lost & Sustained",
        "icon": "activity"
      },
      {
        "value": "100%",
        "label": "Custom No-Starvation Plans",
        "icon": "leaf"
      },
      {
        "value": "1-on-1",
        "label": "Weekly Progress Reviews",
        "icon": "user"
      },
      {
        "value": "4.9 ★",
        "label": "Client Success Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Medical Weight Loss & Fat Reduction",
        "description": "Customized calorie and macronutrient balanced meal plans designed for steady, lifelong fat reduction.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "PCOS, PCOD & Hormonal Balance Diet",
        "description": "Low-glycemic anti-inflammatory diet protocols to regulate menstrual cycles and improve insulin sensitivity.",
        "icon": "heart",
        "duration": "45"
      },
      {
        "name": "Diabetes Glycemic Reversal & CGM Pairing",
        "description": "Carbohydrate counting, continuous glucose monitoring (CGM) analysis, and food-pairing science.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Gut Health, IBS & Food Sensitivity",
        "description": "Elimination-reintroduction protocols, microbiome restoration, and healing chronic bloating/acidity.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Sports Nutrition & Muscle Optimization",
        "description": "Pre/post workout fueling, optimal protein timing, and endurance energy plans for athletes.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Thyroid & Fatty Liver Metabolic Plan",
        "description": "Selenium, zinc, and micronutrient-rich meal structuring to optimize metabolic rate and liver detox.",
        "icon": "leaf",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "Do I have to give up rice, carbs, or my favorite foods?",
        "answer": "Never. Our philosophy is built on sustainable, non-restrictive nutrition with smart portion control and food pairing."
      },
      {
        "question": "How much weight loss is realistic and healthy per month?",
        "answer": "A sustainable rate is approximately 2 to 4 kg per month to ensure fat loss rather than water or muscle loss."
      },
      {
        "question": "Can you design a customized plan for strict vegetarians?",
        "answer": "Yes! We specialize in plant-based nutrition, structuring complete proteins and essential micronutrients using whole foods."
      },
      {
        "question": "How do I start my personalized nutrition plan?",
        "answer": "Click 'Book Appointment' or message our dietitian desk directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "acculab-diagnostics": {
    "id": "acculab-diagnostics",
    "name": "AccuLab Diagnostics",
    "category": "Pathology & Diagnostic Center",
    "primaryColor": "#4338CA",
    "secondaryColor": "#0F172A",
    "accentColor": "#0891B2",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "100% NABL Accredited & AI-Powered Robotic Automated Testing",
    "heroHeading": "Precision Pathology, Advanced Radiology & Same-Day Diagnostic Reports",
    "heroSubheading": "Fully automated clinical pathology, 3T MRI, 128-Slice CT, and painless home blood sample collection with digital smart reports.",
    "tagline": "Precision Diagnostic & Pathology",
    "specialty": "Chief Pathologist & Laboratory Director",
    "degrees": "MBBS, MD Pathology, DNB, NABL Lead Assessor",
    "designation": "Medical Director & Head of Pathology",
    "stats": [
      {
        "value": "99.9%",
        "label": "Diagnostic Accuracy Rate",
        "icon": "microscope"
      },
      {
        "value": "100%",
        "label": "NABL & ICMR Accredited",
        "icon": "shield"
      },
      {
        "value": "6-12 hrs",
        "label": "Same-Day Digital Reports",
        "icon": "clock"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "packages": [
      {
        "name": "Executive Full Body Wellness",
        "parameterCount": "85+ Tests Included",
        "originalPrice": 3999,
        "price": 1499,
        "discount": "62% OFF",
        "fasting": "10-12 Hrs Fasting",
        "reportTime": "Same-Day in 6-12 Hrs",
        "popular": true,
        "features": [
          "Complete Hemogram (CBC 24 Params)",
          "Lipid Profile & Heart Risk (Total, HDL, LDL)",
          "Liver Function Test (LFT 11 Params)",
          "Kidney Function Test (KFT with eGFR)",
          "Thyroid Profile (TSH)",
          "HbA1c & Fasting Blood Glucose",
          "Vitamin D3 & Vitamin B12"
        ]
      },
      {
        "name": "Heart & Diabetes Advanced Care",
        "parameterCount": "62+ Tests Included",
        "originalPrice": 2999,
        "price": 1199,
        "discount": "60% OFF",
        "fasting": "10-12 Hrs Fasting",
        "reportTime": "Digital Report in 8 Hrs",
        "popular": false,
        "features": [
          "Fasting Blood Sugar & HbA1c Average",
          "High-Sensitivity CRP (hs-CRP)",
          "Complete Lipid Profile (HDL/LDL/VLDL)",
          "Serum Creatinine & Urea",
          "Urine Microalbuminuria Screen"
        ]
      },
      {
        "name": "Senior Citizen Comprehensive Care",
        "parameterCount": "92+ Tests Included",
        "originalPrice": 4999,
        "price": 1999,
        "discount": "60% OFF",
        "fasting": "10-12 Hrs Fasting",
        "reportTime": "Same-Day in 12 Hrs",
        "popular": false,
        "features": [
          "Full Organ Profile (Liver, Kidney, Heart)",
          "Bone Mineral Profile (Calcium & Phosphorus)",
          "Arthritis Screen (Uric Acid & RA Factor)",
          "Electrolyte Panel (Sodium & Potassium)",
          "Complete Urine Routine & Microscopy"
        ]
      }
    ],
    "services": [
      {
        "name": "3T MRI & 128-Slice Low-Dose CT Scan",
        "description": "High-resolution brain, spine, joint imaging, and non-invasive coronary CT angiography.",
        "icon": "activity",
        "duration": "30"
      },
      {
        "name": "4D HD Ultrasound & Color Doppler Study",
        "description": "Fetal anomaly scans, abdominal ultrasound, carotid Doppler, and venous Doppler studies.",
        "icon": "sparkles",
        "duration": "25"
      },
      {
        "name": "Comprehensive Pathology & Blood Testing",
        "description": "Fully automated NABL testing for CBC, LFT, KFT, lipid profile, hormones, and vitamins.",
        "icon": "microscope",
        "duration": "15"
      },
      {
        "name": "Painless Doorstep Home Blood Collection",
        "description": "Certified phlebotomist visit at your doorstep with cold-chain sample safety and instant tracking.",
        "icon": "shield",
        "duration": "20"
      },
      {
        "name": "Digital X-Ray & Bone Mineral Density (BMD)",
        "description": "Low-radiation digital radiography and DEXA scan for osteoporosis and fracture risk.",
        "icon": "activity",
        "duration": "15"
      },
      {
        "name": "Cardiac Diagnostics: 2D Echo, ECG & TMT",
        "description": "Color Doppler echocardiography, treadmill stress test, and 24-hour ambulatory Holter monitoring.",
        "icon": "heart",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "Which blood tests require 10 to 12 hours of fasting?",
        "answer": "Tests such as Fasting Blood Sugar, Lipid Profile, and Comprehensive Full Body Checkups require 10 to 12 hours of overnight fasting."
      },
      {
        "question": "How and when will I receive my diagnostic reports?",
        "answer": "Digital smart reports with QR-code verification are sent directly to your WhatsApp and email within 6 to 12 hours."
      },
      {
        "question": "How does Doorstep Home Blood Sample Collection work?",
        "answer": "A certified phlebotomist visits your home at your selected time slot, collects samples using sterile vacutainers, and transports them in cold chain."
      },
      {
        "question": "How do I book a health package or blood test?",
        "answer": "Click 'Book Appointment' or message our diagnostic support team directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_packages",
        "type": "PACKAGES"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "uropulse-advanced": {
    "id": "uropulse-advanced",
    "name": "UroPulse Advanced",
    "category": "Urology & Andrology",
    "primaryColor": "#1D4ED8",
    "secondaryColor": "#0F172A",
    "accentColor": "#06B6D4",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Advanced Laser Kidney Stone Surgery (RIRS) & Discrete Men's Health",
    "heroHeading": "Precision Urology, Laser Kidney Stone Care & Advanced Andrology",
    "heroSubheading": "Specialized in painless laser kidney stone removal, advanced prostate therapy (HoLEP), robotic uro-oncology, and confidential men's health care.",
    "tagline": "Laser Urology & Stone Care",
    "specialty": "Urologist & Andrologist",
    "degrees": "MBBS, MS General Surgery, MCh Urology, DNB, Fellow Endourology",
    "designation": "Chief Urological Surgeon",
    "stats": [
      {
        "value": "12,500+",
        "label": "Laser Uro-Surgeries Done",
        "icon": "shield"
      },
      {
        "value": "100%",
        "label": "No-Cut Keyhole Tech",
        "icon": "activity"
      },
      {
        "value": "Same-Day",
        "label": "Discharge for RIRS Care",
        "icon": "clock"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Laser Kidney Stone Removal (RIRS & PCNL)",
        "description": "Painless retrograde intrarenal surgery using flexible holmium laser fiber for 100% stone clearance without cuts.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Advanced Prostate Care (HoLEP & TURP)",
        "description": "Holmium laser enucleation of prostate (BPH) for rapid relief from urinary blockage with minimal bleeding.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Men's Sexual Health, ED & Andrology",
        "description": "Confidential, scientific management of erectile dysfunction, low testosterone, and male factor infertility.",
        "icon": "heart",
        "duration": "30"
      },
      {
        "name": "Laparoscopic & Robotic Uro-Oncology",
        "description": "Minimally invasive keyhole surgical care for kidney, bladder, and prostate tumors with nerve-sparing precision.",
        "icon": "sparkles",
        "duration": "60"
      },
      {
        "name": "Recurrent UTI & Laser Urethroplasty",
        "description": "Laser urethroplasty, recurrent UTI diagnostics, and uroflowmetry urodynamic studies.",
        "icon": "shield",
        "duration": "30"
      },
      {
        "name": "Overactive Bladder & Female Incontinence",
        "description": "Non-surgical bladder retraining, pelvic muscle therapy, and TVT/TOT sling procedures for urine leakage.",
        "icon": "activity",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "How is laser kidney stone removal (RIRS) done without incisions?",
        "answer": "RIRS uses a flexible endoscope passed naturally through the urinary tract to pulverize stones using a laser fiber, eliminating skin cuts."
      },
      {
        "question": "How quickly can I resume normal work after RIRS?",
        "answer": "Most patients are discharged within 24 hours and resume normal desk work within 48 hours."
      },
      {
        "question": "Are andrology consultations completely confidential?",
        "answer": "Yes, absolute privacy and strict clinical confidentiality are maintained for all male sexual health consultations."
      },
      {
        "question": "How do I book an appointment with the urologist?",
        "answer": "Click 'Book Appointment' or message our urology care reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "oncohorizon-cancer": {
    "id": "oncohorizon-cancer",
    "name": "OncoHorizon Cancer Care",
    "category": "Oncology & Cancer Center",
    "primaryColor": "#7E22CE",
    "secondaryColor": "#0F172A",
    "accentColor": "#EC4899",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Multidisciplinary Tumor Board & Genomic Targeted Precision Oncology",
    "heroHeading": "Comprehensive Oncology, Advanced Immunotherapy & Surgical Cancer Care",
    "heroSubheading": "Delivering compassionate, evidence-based cancer treatments with next-generation targeted therapies, minimally invasive robotic surgery, and radiation.",
    "tagline": "Comprehensive Oncology Care",
    "specialty": "Senior Medical & Surgical Oncologist",
    "degrees": "MBBS, MD Medicine, DM Medical Oncology / MCh Surgical Oncology, DNB",
    "designation": "Director of Comprehensive Cancer Care",
    "stats": [
      {
        "value": "15,000+",
        "label": "Cancer Patients Supported",
        "icon": "heart"
      },
      {
        "value": "100%",
        "label": "Tumor Board Consensus",
        "icon": "shield"
      },
      {
        "value": "Next-Gen",
        "label": "Targeted & Immunotherapy",
        "icon": "sparkles"
      },
      {
        "value": "4.9 ★",
        "label": "Patient & Family Trust",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Precision Medical Oncology & Immunotherapy",
        "description": "Next-generation targeted therapy, PD-L1 immunotherapy, and low-toxicity daycare chemotherapy protocols.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Robotic & Minimally Invasive Surgical Oncology",
        "description": "Organ-preserving tumor resections with sub-millimeter robotic precision for breast, GI, and thoracic cancers.",
        "icon": "activity",
        "duration": "60"
      },
      {
        "name": "Organ-Preserving Breast Cancer & Oncoplasty",
        "description": "Breast-conserving lumpectomy combined with aesthetic reconstruction to preserve natural form.",
        "icon": "heart",
        "duration": "45"
      },
      {
        "name": "Advanced SBRT Stereotactic Radiation Oncology",
        "description": "Sub-millimeter stereotactic body radiotherapy targeting tumors with zero damage to surrounding healthy tissue.",
        "icon": "sparkles",
        "duration": "30"
      },
      {
        "name": "Hematology & Bone Marrow Stem Cell Care",
        "description": "Specialized care for leukemia, lymphoma, multiple myeloma, and autologous stem cell transplantation.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Cancer Screening & Second Opinion Clinic",
        "description": "Comprehensive genetic risk evaluation, PET-CT review, and consensus second opinions by senior oncology boards.",
        "icon": "activity",
        "duration": "45"
      }
    ],
    "faqs": [
      {
        "question": "How does a Multidisciplinary Tumor Board improve cancer treatment?",
        "answer": "Our Tumor Board brings together Medical, Surgical, and Radiation Oncologists to collectively create a consensus, personalized treatment roadmap."
      },
      {
        "question": "How does targeted therapy and immunotherapy differ from chemotherapy?",
        "answer": "Targeted therapy specifically attacks cancer cells or boosts your immune system with significantly fewer side effects."
      },
      {
        "question": "Can I get an urgent second opinion on my PET-CT scan?",
        "answer": "Yes, our oncology second-opinion clinic provides expedited 24-48 hour case reviews."
      },
      {
        "question": "How do I book an oncology consultation?",
        "answer": "Click 'Book Appointment' or message our cancer care desk directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "gastrosurg-advanced": {
    "id": "gastrosurg-advanced",
    "name": "GastroSurg Advanced",
    "category": "General Surgery & GI Surgery",
    "primaryColor": "#0F766E",
    "secondaryColor": "#0F172A",
    "accentColor": "#D97706",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Advanced 4K Laparoscopic & Laser GI Surgical Center",
    "heroHeading": "Minimally Invasive Laparoscopy, GI Surgery & Laser Proctology",
    "heroSubheading": "Led by senior GI & Laparoscopic Surgeons specializing in painless laser piles treatment, 3D mesh hernia repair, and gallbladder removal.",
    "tagline": "GI & Laparoscopic Surgery",
    "specialty": "GI & Laparoscopic Surgeon",
    "degrees": "MBBS, MS General Surgery, MCh Surgical Gastroenterology, FMAS, FIAGES",
    "designation": "Chief of GI & Laparoscopic Surgery",
    "stats": [
      {
        "value": "20,000+",
        "label": "Laparoscopic & Laser Surgeries",
        "icon": "shield"
      },
      {
        "value": "100%",
        "label": "Minimally Invasive 4K Tech",
        "icon": "activity"
      },
      {
        "value": "24 Hrs",
        "label": "Rapid Post-Op Discharge",
        "icon": "clock"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Laparoscopic Gallbladder Removal",
        "description": "Keyhole surgery with tiny micro-incisions for gallstones with same-day walking and 24-hr discharge.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "3D Mesh Laparoscopic Hernia Repair",
        "description": "Tension-free laparoscopic TEP/TAPP mesh repair with zero recurrences and rapid return to work.",
        "icon": "shield",
        "duration": "45"
      },
      {
        "name": "Laser Proctology (Piles, Fissure & Fistula)",
        "description": "German diode laser treatment without painful cuts or daily dressing, ensuring immediate pain relief.",
        "icon": "sparkles",
        "duration": "30"
      },
      {
        "name": "Laparoscopic Appendix Removal",
        "description": "Emergency keyhole removal for acute appendicitis with minimal blood loss and swift recovery.",
        "icon": "activity",
        "duration": "30"
      },
      {
        "name": "Gastrointestinal & Colorectal Tumor Surgery",
        "description": "Comprehensive oncologic resections for stomach, colon, and rectum cancers with lymph node clearance.",
        "icon": "shield",
        "duration": "60"
      },
      {
        "name": "Bariatric & Metabolic Weight Loss Surgery",
        "description": "Laparoscopic Sleeve Gastrectomy and Gastric Bypass for severe obesity and long-term diabetes remission.",
        "icon": "heart",
        "duration": "60"
      }
    ],
    "faqs": [
      {
        "question": "How much pain is involved in laparoscopic gallbladder removal?",
        "answer": "Laparoscopic cholecystectomy uses 3 to 4 tiny keyhole incisions (5-10 mm). Pain is minimal, allowing walking within hours."
      },
      {
        "question": "Why is laser piles treatment better than open surgery?",
        "answer": "Laser proctology causes no surgical cuts or sphincter damage, requires no dressings, and allows same-day discharge."
      },
      {
        "question": "Can a hernia heal on its own without surgery?",
        "answer": "No, a hernia is an anatomical defect that requires laparoscopic mesh repair to prevent complications."
      },
      {
        "question": "How do I book a consultation with the GI surgeon?",
        "answer": "Click 'Book Appointment' or message our surgical care reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "kinetic-physio": {
    "id": "kinetic-physio",
    "name": "KineticPhysio Pro",
    "category": "Physiotherapy & Sports Rehab",
    "primaryColor": "#0284C7",
    "secondaryColor": "#0F172A",
    "accentColor": "#EA580C",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "100% Non-Surgical Drug-Free Pain Relief & Rapid Movement Restoration",
    "heroHeading": "Advanced Physiotherapy, Sports Rehabilitation & Spine Decompression",
    "heroSubheading": "Restoring pain-free movement with customized manual therapy, robotic laser electrotherapy, dry needling, and structured rehabilitation.",
    "tagline": "Physiotherapy & Sports Rehab",
    "specialty": "Consultant Physiotherapist & Sports Rehab Specialist",
    "degrees": "BPT, MPT Musculoskeletal & Sports Physio, Certified Dry Needling Practitioner",
    "designation": "Director of Physical Rehabilitation",
    "stats": [
      {
        "value": "25,000+",
        "label": "Rehab Sessions Delivered",
        "icon": "activity"
      },
      {
        "value": "100%",
        "label": "Hands-On Manual Therapy",
        "icon": "shield"
      },
      {
        "value": "98.8%",
        "label": "Pain Relief Success Rate",
        "icon": "sparkles"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Spine Decompression & Sciatica Relief",
        "description": "Non-surgical motorized spinal traction, core stabilization, and nerve flossing for instant sciatica relief.",
        "icon": "heart",
        "duration": "45"
      },
      {
        "name": "Sports Injury Rehab & Return-to-Play",
        "description": "ACL rehab, rotator cuff strengthening, runners knee therapy, and athletic agility conditioning.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Advanced Dry Needling & Cupping",
        "description": "Targeted deep muscle trigger point release, chronic knot reduction, and enhanced tissue blood flow.",
        "icon": "sparkles",
        "duration": "30"
      },
      {
        "name": "Robotic Electrotherapy & Cold Laser",
        "description": "Deep tissue cellular biostimulation for rapid joint inflammation reduction and tendon healing.",
        "icon": "shield",
        "duration": "30"
      },
      {
        "name": "Post-Surgical Joint Rehab (Knee/Shoulder)",
        "description": "Guided range-of-motion recovery, gait retraining, and scar tissue breakdown after surgery.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "Ergonomic Posture & Tech-Neck Care",
        "description": "Biomechanical spinal alignment, cervical traction, and customized workplace workstation ergonomics.",
        "icon": "sparkles",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "How many physiotherapy sessions are typically required for back pain?",
        "answer": "Most acute conditions show substantial pain reduction within 3 to 6 sessions, while chronic issues benefit from a 10 to 12 session program."
      },
      {
        "question": "Does dry needling therapy hurt?",
        "answer": "Most patients feel only a slight prick when the needle is inserted, followed by a brief release of the tight muscle knot."
      },
      {
        "question": "What should I wear to my first physiotherapy evaluation?",
        "answer": "Wear comfortable, loose athletic clothes that allow easy movement and evaluation."
      },
      {
        "question": "How do I book a physiotherapy session?",
        "answer": "Click 'Book Appointment' or message our physical therapy desk directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  },
  "endometabolic-care": {
    "id": "endometabolic-care",
    "name": "EndoMeta Care",
    "category": "Diabetology & Endocrinology",
    "primaryColor": "#1E3A8A",
    "secondaryColor": "#0F172A",
    "accentColor": "#0284C7",
    "fontHeading": "Plus Jakarta Sans",
    "fontBody": "Inter",
    "buttonRadius": "xl",
    "badgeText": "Type-2 Diabetes Reversal & Advanced Hormonal Harmony",
    "heroHeading": "Precision Endocrinology, Diabetes Reversal & Thyroid Care",
    "heroSubheading": "Led by DM Endocrinologists specializing in personalized Type-1 & Type-2 diabetes management, sensor-guided CGM insulin therapy, and thyroid care.",
    "tagline": "Endocrinology & Diabetes Reversal",
    "specialty": "Endocrinologist & Diabetologist",
    "degrees": "MBBS, MD Medicine, DM Endocrinology, Fellow Endocrine Society USA",
    "designation": "Head of Endocrinology & Diabetology",
    "stats": [
      {
        "value": "18,000+",
        "label": "Diabetic & Hormone Patients",
        "icon": "activity"
      },
      {
        "value": "100%",
        "label": "CGM Sensor-Guided Plans",
        "icon": "shield"
      },
      {
        "value": "<6.5%",
        "label": "Target HbA1c Goal Rate",
        "icon": "sparkles"
      },
      {
        "value": "4.9 ★",
        "label": "Google Patient Rating",
        "icon": "star"
      }
    ],
    "services": [
      {
        "name": "Type-2 Diabetes Reversal & Remission",
        "description": "Evidence-based lifestyle and pharmacological protocols to lower HbA1c and reverse insulin resistance.",
        "icon": "activity",
        "duration": "45"
      },
      {
        "name": "CGM Sensor Telemetry & Insulin Pumps",
        "description": "24/7 real-time continuous glucose monitoring and automated smart insulin pump optimization.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Comprehensive Thyroid Clinic (Hypo/Hyper)",
        "description": "Precision TSH titration, antibody screening (Anti-TPO), and ultrasound nodule surveillance.",
        "icon": "shield",
        "duration": "30"
      },
      {
        "name": "Diabetic Foot & Kidney Care Prevention",
        "description": "Digital biothesiometry foot risk profiling, microalbuminuria kidney check, and retina screening.",
        "icon": "heart",
        "duration": "45"
      },
      {
        "name": "PCOS, Obesity & Metabolic Optimization",
        "description": "Root-cause androgen suppression, insulin sensitization, and weight loss pharmacotherapy.",
        "icon": "sparkles",
        "duration": "45"
      },
      {
        "name": "Pituitary, Adrenal & Bone Health",
        "description": "Prolactin, cortisol, growth hormone evaluation, and DEXA bone density scan management for osteoporosis.",
        "icon": "activity",
        "duration": "30"
      }
    ],
    "faqs": [
      {
        "question": "Can Type-2 Diabetes truly be reversed?",
        "answer": "Yes! With medically supervised caloric deficit, low-glycemic nutrition, and visceral fat reduction, many patients achieve drug-free remission."
      },
      {
        "question": "How do Continuous Glucose Monitoring (CGM) sensors work?",
        "answer": "A small sensor placed on the upper arm measures glucose continuously for 14 days, transmitting data directly to your phone without finger pricks."
      },
      {
        "question": "How often should thyroid medicine dosage be evaluated?",
        "answer": "Every 6 to 8 weeks after starting or adjusting medication until TSH stabilizes, and every 6 to 12 months thereafter."
      },
      {
        "question": "How do I book an appointment with the endocrinologist?",
        "answer": "Click 'Book Appointment' or message our diabetes care reception directly on WhatsApp."
      }
    ],
    "sections": [
      {
        "id": "sec_hero",
        "type": "HERO"
      },
      {
        "id": "sec_stats",
        "type": "STATS_RIBBON"
      },
      {
        "id": "sec_services",
        "type": "SERVICES"
      },
      {
        "id": "sec_bio",
        "type": "DOCTOR_BIO"
      },
      {
        "id": "sec_reviews",
        "type": "REVIEWS"
      },
      {
        "id": "sec_cta",
        "type": "CTA_BANNER"
      },
      {
        "id": "sec_faq",
        "type": "FAQ"
      },
      {
        "id": "sec_map",
        "type": "MAP_HOURS"
      }
    ]
  }
};

export function getThemePreset(themeId: string): ThemePreset {
  return THEME_PRESETS[themeId] || THEME_PRESETS["apex-clinical"];
}