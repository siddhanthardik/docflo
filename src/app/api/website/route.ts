import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;

    // Fetch existing website or fetch doctor profile to create initial recommendation
    const website = await prisma.clinicWebsite.findUnique({
      where: { doctorId },
    });

    // Also fetch connected doctor profile for auto-generation reference
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        serviceTypes: { where: { isActive: true } },
        reviews: { orderBy: { reviewDate: "desc" }, take: 6 },
        gbpAccounts: { take: 1 },
      },
    });

    return NextResponse.json({
      website,
      doctor: doctor
        ? {
            name: doctor.name,
            clinicName: doctor.clinicName,
            specialty: doctor.specialty,
            phone: doctor.phone,
            address: doctor.address,
            city: doctor.city,
            workingHoursStart: doctor.workingHoursStart,
            workingHoursEnd: doctor.workingHoursEnd,
            daysOff: doctor.daysOff,
            services: doctor.serviceTypes,
            reviews: doctor.reviews,
            hasGbp: doctor.gbpAccounts.length > 0,
          }
        : null,
    });
  } catch (error: any) {
    console.error("[WEBSITE API GET ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch website" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const body = await req.json();

    const {
      subdomain,
      themeId = "apex-clinical",
      primaryColor = "#2563EB",
      secondaryColor = "#0F172A",
      accentColor = "#10B981",
      fontHeading = "Plus Jakarta Sans",
      fontBody = "Inter",
      siteTitle,
      tagline,
      heroHeading,
      heroSubheading,
      heroImage,
      heroStyle = "SPLIT_FORM",
      announcementBar,
      ctaButtonText = "Book Appointment",
      ctaButtonAction = "BOOKING_MODAL",
      whatsappNumber,
      contactPhone,
      contactEmail,
      showServices = true,
      showReviews = true,
      showDoctorBio = true,
      showFaq = true,
      showMap = true,
      showStickyBar = true,
      customServices,
      customFaqs,
      customBio,
      metaTitle,
      metaDescription,
    } = body;

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

    // Check collision
    const existing = await prisma.clinicWebsite.findFirst({
      where: { subdomain: cleanSubdomain, doctorId: { not: doctorId } },
    });

    if (existing) {
      return NextResponse.json({ error: `Subdomain "${cleanSubdomain}" is already taken.` }, { status: 400 });
    }

    const website = await prisma.clinicWebsite.upsert({
      where: { doctorId },
      create: {
        doctorId,
        subdomain: cleanSubdomain,
        themeId,
        primaryColor,
        secondaryColor,
        accentColor,
        fontHeading,
        fontBody,
        siteTitle: siteTitle || "Clinic Website",
        tagline,
        heroHeading: heroHeading || siteTitle || "Premier Healthcare Clinic",
        heroSubheading,
        heroImage,
        heroStyle,
        announcementBar,
        ctaButtonText,
        ctaButtonAction,
        whatsappNumber,
        contactPhone,
        contactEmail,
        showServices,
        showReviews,
        showDoctorBio,
        showFaq,
        showMap,
        showStickyBar,
        customServices: customServices || [],
        customFaqs: customFaqs || [],
        customBio,
        metaTitle: metaTitle || siteTitle,
        metaDescription,
        isPublished: true,
      },
      update: {
        subdomain: cleanSubdomain,
        themeId,
        primaryColor,
        secondaryColor,
        accentColor,
        fontHeading,
        fontBody,
        siteTitle,
        tagline,
        heroHeading,
        heroSubheading,
        heroImage,
        heroStyle,
        announcementBar,
        ctaButtonText,
        ctaButtonAction,
        whatsappNumber,
        contactPhone,
        contactEmail,
        showServices,
        showReviews,
        showDoctorBio,
        showFaq,
        showMap,
        showStickyBar,
        customServices,
        customFaqs,
        customBio,
        metaTitle,
        metaDescription,
        isPublished: true,
      },
    });

    return NextResponse.json(website);
  } catch (error: any) {
    console.error("[WEBSITE API POST/PUT ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to save website" }, { status: 500 });
  }
}
