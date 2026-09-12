import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WebsiteFactoryService } from "@/services/website-factory.service";
import { PageSection } from "@/components/themes/theme-types";

// Helper to sanitize slug
function generateSubdomain(name: string, city: string = ""): string {
  const clean = (name || "clinic")
    .toLowerCase()
    .replace(/^dr.?\s*/i, "dr-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean.slice(0, 30) || "clinic";
}

// ── GET: Check for Connected GBP Profile for 1-Click Fast-Track ────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId || session.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        gbpAccounts: {
          include: {
            profileSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          take: 1,
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const gbpAccount = doctor.gbpAccounts[0];
    if (!gbpAccount) {
      return NextResponse.json({ connected: false });
    }

    const snapshot = gbpAccount.profileSnapshots?.[0];
    const snapshotJson = (snapshot?.json as any) || {};
    const insights = (gbpAccount.insightsData as any) || {};

    const businessName = insights.name || snapshotJson.businessName || doctor.clinicName || doctor.name || "Clinic";
    const address = insights.formattedAddress || snapshotJson.formattedAddress || snapshotJson.address || doctor.address || "";
    const rating = insights.rating || snapshotJson.rating || 5.0;
    const userRatingsTotal = insights.user_ratings_total || snapshotJson.user_ratings_total || 0;
    const phone = insights.phone || snapshotJson.phone || doctor.phone || "";
    const description = insights.description || snapshotJson.description || "";
    const primaryCategory = insights.categories?.primaryCategory?.displayName || snapshotJson.primaryCategory || doctor.specialty || "Medical Clinic";

    return NextResponse.json({
      connected: true,
      gbpAccountId: gbpAccount.id,
      locationName: gbpAccount.locationName,
      businessName,
      address,
      rating,
      userRatingsTotal,
      phone,
      description,
      primaryCategory,
      doctorName: doctor.name,
    });
  } catch (error: any) {
    console.error("[AUTO-BUILD GET ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch GBP status" }, { status: 500 });
  }
}

// ── POST: Execute Gyrex Clinical AI Auto-Build (45s Synthesis) ─────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId || session.user.id;
    const body = await req.json();
    const { gbpAccountId, placeId, doctorName: inputDoctor, clinicName: inputClinic, specialty: inputSpecialty, city: inputCity, phone: inputPhone } = body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        gbpAccounts: {
          include: {
            profileSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        reviews: { orderBy: { reviewDate: "desc" }, take: 10 },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

    // 1. Data Aggregation Containers
    let clinicName = inputClinic || doctor.clinicName || doctor.name || "Clinic";
    let docName = inputDoctor || doctor.name || "Doctor";
    let specialty = inputSpecialty || doctor.specialty || "Healthcare";
    let city = inputCity || doctor.city || "New Delhi";
    let phone = inputPhone || doctor.phone || "";
    let clinicAddress = doctor.address || "";
    let businessDescription = "";
    let gbpRating = 5.0;
    let gbpReviewCount = 0;
    let importedPhotos: string[] = [];
    let importedReviews: Array<{ author_name: string; rating: number; text: string; reviewDate: string }> = [];
    let openingHoursText = "Mon–Sat: 09:00 AM – 08:00 PM";

    // 2. Fetch from Connected GBP Account if available
    const gbpAccount = doctor.gbpAccounts.find((a) => a.id === gbpAccountId) || doctor.gbpAccounts[0];
    if (gbpAccount) {
      const insights = (gbpAccount.insightsData as any) || {};
      const snapshot = gbpAccount.profileSnapshots?.[0];
      const snapshotJson = (snapshot?.json as any) || {};

      if (insights.name || snapshotJson.businessName) {
        clinicName = insights.name || snapshotJson.businessName;
      }
      if (insights.formattedAddress || snapshotJson.formattedAddress) {
        clinicAddress = insights.formattedAddress || snapshotJson.formattedAddress;
      }
      if (insights.phone || snapshotJson.phone) {
        phone = insights.phone || snapshotJson.phone;
      }
      if (insights.description || snapshotJson.description) {
        businessDescription = insights.description || snapshotJson.description;
      }
      if (insights.rating) gbpRating = Number(insights.rating);
      if (insights.user_ratings_total) gbpReviewCount = Number(insights.user_ratings_total);
      if (insights.categories?.primaryCategory?.displayName) {
        specialty = insights.categories.primaryCategory.displayName;
      }

      // Convert stored DB reviews
      if (doctor.reviews && doctor.reviews.length > 0) {
        importedReviews = doctor.reviews.map((r) => ({
          author_name: r.reviewerName,
          rating: r.rating,
          text: r.comment || "Highly experienced and compassionate doctor.",
          reviewDate: r.reviewDate ? r.reviewDate.toISOString().split("T")[0] : "Recent",
        }));
      }
    }

    // 3. Fetch from Google Places API (if placeId provided)
    if (placeId && apiKey) {
      try {
        const fields = [
          "name",
          "formatted_address",
          "formatted_phone_number",
          "international_phone_number",
          "website",
          "rating",
          "user_ratings_total",
          "opening_hours",
          "photos",
          "editorial_summary",
          "reviews",
          "geometry",
        ].join(",");

        const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
        const pRes = await fetch(placeUrl);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.result) {
            const r = pData.result;
            if (r.name) clinicName = r.name;
            if (r.formatted_address) clinicAddress = r.formatted_address;
            if (r.formatted_phone_number || r.international_phone_number) {
              phone = r.formatted_phone_number || r.international_phone_number;
            }
            if (r.rating) gbpRating = r.rating;
            if (r.user_ratings_total) gbpReviewCount = r.user_ratings_total;
            if (r.editorial_summary?.overview) {
              businessDescription = r.editorial_summary.overview;
            }
            if (r.opening_hours?.weekday_text && Array.isArray(r.opening_hours.weekday_text)) {
              openingHoursText = r.opening_hours.weekday_text.slice(0, 3).join(", ");
            }

            // Extract Google Place Photos (up to 10 photos)
            if (r.photos && Array.isArray(r.photos) && r.photos.length > 0) {
              importedPhotos = r.photos.slice(0, 10).map((p: any) =>
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${p.photo_reference}&key=${apiKey}`
              );
            }

            // Extract Google Reviews if present
            if (r.reviews && Array.isArray(r.reviews) && r.reviews.length > 0) {
              importedReviews = r.reviews.map((rev: any) => ({
                author_name: rev.author_name || "Verified Patient",
                rating: rev.rating || 5,
                text: rev.text || "Exceptional consultation, polite staff and fast recovery.",
                reviewDate: rev.relative_time_description || "Recent",
              }));
            }
          }
        }
      } catch (placeErr) {
        console.warn("[AUTO-BUILD PLACE DETAILS WARNING]:", placeErr);
      }
    }

    // 4. Extract City from Address if not provided
    if (clinicAddress && (!inputCity || inputCity === "New Delhi")) {
      const parts = clinicAddress.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        const potentialCity = parts[parts.length - 2].replace(/\d+/g, "").trim();
        if (potentialCity) city = potentialCity;
      }
    }

    // 5. Specialty Theme Preset & Clinical Copy Synthesis
    const themeDef = WebsiteFactoryService.getSpecialtyThemeDefaults(specialty);
    const specialtyLower = specialty.toLowerCase();

    // Curated Services based on Specialty
    let generatedServices = [
      {
        name: "Comprehensive Clinical Consultation",
        description: `Detailed diagnosis, physical assessment, and tailored treatment planning by ${docName}.`,
        duration: 30,
        price: 500,
        icon: "stethoscope",
      },
      {
        name: `Specialized ${specialty} Care`,
        description: `Evidence-based clinical treatments, modern diagnostics, and dedicated patient care in ${city}.`,
        duration: 45,
        price: 800,
        icon: "activity",
      },
      {
        name: "Follow-Up & Recovery Review",
        description: "Continuous progress evaluation, prescription optimization, and clinical guidance.",
        duration: 20,
        price: 0,
        icon: "shield",
      },
    ];

    if (specialtyLower.includes("pediat") || specialtyLower.includes("child")) {
      generatedServices = [
        {
          name: "IAP Vaccination & Immunization",
          description: "Complete official IAP schedule vaccines with certified cold chain storage and digital reminder cards.",
          duration: 30,
          price: 600,
          icon: "syringe",
        },
        {
          name: "Child Growth & Developmental Milestone Review",
          description: "Physical growth monitoring (height, weight, BMI percentile) and cognitive development assessment.",
          duration: 30,
          price: 500,
          icon: "baby",
        },
        {
          name: "Pediatric Acute Infection & Allergy Care",
          description: "Diagnosis and treatment for fever, asthma, respiratory allergies, colic, and childhood infections.",
          duration: 30,
          price: 500,
          icon: "stethoscope",
        },
      ];
    } else if (specialtyLower.includes("dent") || specialtyLower.includes("smile")) {
      generatedServices = [
        {
          name: "Painless Root Canal Treatment (RCT)",
          description: "Single-sitting rotary endodontics with computerized anesthesia for completely comfortable treatment.",
          duration: 45,
          price: 2500,
          icon: "smile",
        },
        {
          name: "Laser Teeth Whitening & Cosmetic Smile Design",
          description: "Advanced cosmetic smile makeover, ceramic veneers, and safe enamel brightening.",
          duration: 45,
          price: 4500,
          icon: "sparkles",
        },
        {
          name: "Dental Implants & Digital Radiography",
          description: "Precision titanium implants and low-radiation digital radiography for permanent replacement.",
          duration: 60,
          price: 18000,
          icon: "cross",
        },
      ];
    } else if (specialtyLower.includes("derma") || specialtyLower.includes("skin")) {
      generatedServices = [
        {
          name: "Medical Acne & Scar Revision Laser",
          description: "Clinical dermatology protocol targeting active acne, stubborn blemishes, and post-acne scars.",
          duration: 45,
          price: 2200,
          icon: "sparkles",
        },
        {
          name: "Anti-Aging, Botox & PRP Hair Therapy",
          description: "FDA-approved aesthetic rejuvenating injectables and autologous growth factor hair restoration.",
          duration: 45,
          price: 4500,
          icon: "activity",
        },
        {
          name: "Advanced Medi-Facial & Hydra Radiance",
          description: "Deep pore infusion, medical peel, and intense hydration for refreshed clinical glow.",
          duration: 45,
          price: 2500,
          icon: "leaf",
        },
      ];
    }

    // Curated Patient FAQs
    const generatedFaqs = [
      {
        question: `How do I book an appointment with ${docName}?`,
        answer: `You can reserve your consultation slot directly online via our booking button or message our 24/7 AI Receptionist on WhatsApp at ${phone || "our clinic number"}.`,
      },
      {
        question: `What are the clinic consultation timings in ${city}?`,
        answer: `Our clinic is open Monday to Saturday: ${openingHoursText}. Prior appointments receive queue priority.`,
      },
      {
        question: "Is walk-in consultation allowed or is prior appointment mandatory?",
        answer: "While pre-booked appointments receive dedicated priority to minimize waiting time, emergency and walk-in patients are warmly attended.",
      },
    ];

    // Build Photos: Top photo is Hero, remaining photos populate Gallery
    const heroImage = importedPhotos.length > 0 ? importedPhotos[0] : (doctor.image || "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80");
    const sliderImages = importedPhotos.length > 1 ? importedPhotos.slice(0, 4) : [heroImage];

    const galleryCaptions = [
      "Consultation & Examination Suite",
      "Modern Diagnostic & Treatment Area",
      "Reception & Patient Comfort Lounge",
      "Advanced Clinical Care Room",
      "Pharmacy & Procedure Station",
      "Clinic Exterior & Accessible Entrance",
    ];

    const galleryImages = importedPhotos.length > 1
      ? importedPhotos.slice(1, 7).map((url, idx) => ({
          url,
          caption: galleryCaptions[idx % galleryCaptions.length],
        }))
      : [
          { url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80", caption: "Consultation Suite" },
          { url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80", caption: "Clinical Care Room" },
          { url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80", caption: "Reception Lounge" },
        ];

    // Formulate Doctor Bio & Clinical Narrative from GBP Description
    const bioText = businessDescription && businessDescription.trim().length > 40
      ? businessDescription.trim()
      : `${docName} is a senior consultant in ${specialty} with extensive clinical experience. Practicing at ${clinicName} in ${city}, ${docName} is dedicated to compassionate, evidence-based healthcare and high patient satisfaction.`;

    // Accurate Google Maps Pin Embed URL
    const fullPinQuery = `${clinicName} ${clinicAddress}`.trim();
    const mapEmbedUrl = fullPinQuery
      ? `https://maps.google.com/maps?q=${encodeURIComponent(fullPinQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
      : null;

    // Subdomain
    const subdomain = generateSubdomain(docName || clinicName, city);

    // Standard high-conversion sections sequence
    const sections: PageSection[] = [
      { id: "sec_hero", type: "HERO", badgeText: `Google Rated ★ ${gbpRating.toFixed(1)} (${gbpReviewCount > 0 ? `${gbpReviewCount}+ Reviews` : "Verified Practice"})`, subtitle: "" },
      { id: "sec_stats", type: "STATS_RIBBON" },
      { id: "sec_services", type: "SERVICES", title: "Specialized Clinical Treatments" },
      { id: "sec_reviews", type: "REVIEWS", title: "Google Patient Reviews" },
      { id: "sec_bio", type: "DOCTOR_BIO", title: `Meet ${docName}` },
      { id: "sec_gallery", type: "GALLERY", title: "Our Modern Clinical Facilities" },
      { id: "sec_cta", type: "CTA_BANNER", title: `Ready to Consult with ${docName}?`, subtitle: "Book your appointment online or chat directly with our clinic on WhatsApp." },
      { id: "sec_faq", type: "FAQ", title: "Frequently Asked Questions" },
      { id: "sec_map", type: "MAP_HOURS", title: "Visit Our Clinic" },
    ];

    // 6. Upsert to ClinicWebsite Database
    const websitePayload: any = {
      doctorId,
      subdomain,
      themeId: themeDef.themeId,
      primaryColor: themeDef.primaryColor,
      secondaryColor: themeDef.secondaryColor,
      accentColor: themeDef.accentColor,
      fontHeading: themeDef.fontHeading,
      fontBody: themeDef.fontBody,
      buttonRadius: "2xl",
      siteTitle: clinicName,
      tagline: `Leading ${specialty} in ${city} • Rated ${gbpRating.toFixed(1)} ★`,
      heroHeading: `Advanced ${specialty} & Dedicated Patient Care`,
      heroSubheading: `Led by ${docName} at ${clinicName}. Delivering patient-centered clinical excellence, modern diagnostics, and compassionate healthcare in ${city}.`,
      heroImage,
      heroSliderImages: sliderImages,
      heroStyle: "SPLIT",
      announcementBar: `Now accepting appointments online. Consult ${docName} this week.`,
      showAnnouncementBar: true,
      ctaButtonText: "Book Appointment",
      ctaButtonAction: "BOOKING_MODAL",
      secondaryCtaText: "WhatsApp Chat",
      secondaryCtaAction: "WHATSAPP",
      whatsappNumber: phone,
      contactPhone: phone,
      contactEmail: doctor.email,
      showServices: true,
      showReviews: true,
      showDoctorBio: true,
      showFaq: true,
      showMap: true,
      showStickyBar: true,
      clinicAddress,
      mapEmbedUrl,
      customServices: generatedServices,
      customFaqs: generatedFaqs,
      customBio: bioText,
      doctorInfo: {
        name: docName,
        specialty,
        degrees: doctor.degrees || "MBBS, MD",
        designation: doctor.designation || `Lead Consultant - ${specialty}`,
        image: doctor.image || heroImage,
      },
      galleryImages,
      sections,
      metaTitle: `${clinicName} | Top ${specialty} in ${city}`,
      metaDescription: `Book consultation with ${docName} at ${clinicName}, ${city}. Rated ${gbpRating.toFixed(1)} on Google with verified patient reviews.`,
    };

    const savedWebsite = await prisma.clinicWebsite.upsert({
      where: { doctorId },
      create: {
        ...websitePayload,
        doctor: { connect: { id: doctorId } },
      },
      update: websitePayload,
    });

    // Also sync doctor model credentials
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        clinicName,
        specialty,
        city,
        address: clinicAddress || doctor.address,
        phone: phone || doctor.phone,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Clinic website synthesized from Google Business Profile successfully in 45s",
      website: savedWebsite,
      stats: {
        photosImported: importedPhotos.length,
        reviewsImported: importedReviews.length,
        rating: gbpRating,
        themeApplied: themeDef.themeId,
      },
    });
  } catch (error: any) {
    console.error("[AUTO-BUILD POST ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to auto-build website" }, { status: 500 });
  }
}
