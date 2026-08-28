import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WebsiteFactoryService } from "@/services/website-factory.service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const { searchParams } = new URL(req.url);
    const forceSync = searchParams.get("sync") === "true";

    let website = await prisma.clinicWebsite.findUnique({
      where: { doctorId },
    });

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        serviceTypes: { where: { isActive: true } },
        reviews: { orderBy: { reviewDate: "desc" }, take: 8 },
        gbpAccounts: {
          include: {
            profileSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          take: 1,
        },
      },
    });

    // If website does not exist yet or user requested full GBP re-sync
    if (!website || forceSync) {
      const synth = await WebsiteFactoryService.synthesizeClinicWebsite(doctorId);

      // Check slug collision
      let targetSubdomain = synth.subdomain;
      const existing = await prisma.clinicWebsite.findFirst({
        where: { subdomain: targetSubdomain, doctorId: { not: doctorId } },
      });
      if (existing) {
        targetSubdomain = `${targetSubdomain}-${Math.floor(100 + Math.random() * 900)}`;
      }

      website = await prisma.clinicWebsite.upsert({
        where: { doctorId },
        create: {
          doctorId,
          subdomain: targetSubdomain,
          themeId: synth.themeId,
          primaryColor: synth.primaryColor,
          secondaryColor: synth.secondaryColor,
          accentColor: synth.accentColor,
          fontHeading: synth.fontHeading,
          fontBody: synth.fontBody,
          siteTitle: synth.siteTitle,
          tagline: synth.tagline,
          heroHeading: synth.heroHeading,
          heroSubheading: synth.heroSubheading,
          heroImage: synth.heroImage,
          heroStyle: synth.heroStyle,
          showHeroBookingForm: synth.showHeroBookingForm,
          announcementBar: synth.announcementBar,
          ctaButtonText: synth.ctaButtonText,
          ctaButtonAction: synth.ctaButtonAction,
          whatsappNumber: synth.whatsappNumber,
          contactPhone: synth.contactPhone,
          contactEmail: synth.contactEmail,
          showServices: synth.showServices,
          showReviews: synth.showReviews,
          showDoctorBio: synth.showDoctorBio,
          showFaq: synth.showFaq,
          showMap: synth.showMap,
          showStickyBar: synth.showStickyBar,
          customServices: synth.customServices,
          customFaqs: synth.customFaqs,
          customBio: synth.customBio,
          sections: synth.sections || [],
          metaTitle: synth.metaTitle,
          metaDescription: synth.metaDescription,
          isPublished: true,
        },
        update: forceSync
          ? {
              siteTitle: synth.siteTitle,
              tagline: synth.tagline,
              heroHeading: synth.heroHeading,
              heroSubheading: synth.heroSubheading,
              contactPhone: synth.contactPhone,
              whatsappNumber: synth.whatsappNumber,
              customServices: synth.customServices,
              customFaqs: synth.customFaqs,
              customBio: synth.customBio,
              showHeroBookingForm: synth.showHeroBookingForm,
            }
          : {},
      });
    }

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
      heroStyle = "IMAGE_ONLY",
      showHeroBookingForm = false,
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
      sections,
      metaTitle,
      metaDescription,
    } = body;

    if (!subdomain) {
      return NextResponse.json({ error: "Website URL name is required" }, { status: 400 });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

    const existing = await prisma.clinicWebsite.findFirst({
      where: { subdomain: cleanSubdomain, doctorId: { not: doctorId } },
    });

    if (existing) {
      return NextResponse.json({ error: `Website URL "${cleanSubdomain}.gyrex.in" is already claimed.` }, { status: 400 });
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
        showHeroBookingForm,
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
        sections: sections || [],
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
        showHeroBookingForm,
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
        sections: sections || [],
        metaTitle,
        metaDescription,
        isPublished: true,
      },
    });

    return NextResponse.json(website);
  } catch (error: any) {
    console.error("[WEBSITE API POST ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to save website" }, { status: 500 });
  }
}
