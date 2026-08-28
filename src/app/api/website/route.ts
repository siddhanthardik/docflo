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
    const url = new URL(req.url);
    const forceSync = url.searchParams.get("sync") === "true";

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        gbpAccounts: {
          include: {
            profileSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          take: 1,
        },
        reviews: { orderBy: { reviewDate: "desc" }, take: 10 },
        serviceTypes: { where: { isActive: true } },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    // Extract detailed GBP address if available
    const gbpAccount = doctor.gbpAccounts[0];
    const gbpSnapshot = gbpAccount?.profileSnapshots?.[0];
    const snapshotJson = (gbpSnapshot?.json as any) || {};
    const gbpAddress = snapshotJson.formattedAddress || snapshotJson.address || (snapshotJson.storefrontAddress?.addressLines?.join(", ")) || doctor.address || "";

    let existingWebsite = await prisma.clinicWebsite.findUnique({
      where: { doctorId },
    });

    if (!existingWebsite || forceSync) {
      const synth = await WebsiteFactoryService.synthesizeClinicWebsite(doctorId);
      existingWebsite = await prisma.clinicWebsite.upsert({
        where: { doctorId },
        create: {
          doctorId,
          subdomain: synth.subdomain,
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
          heroSliderImages: [],
          heroStyle: synth.heroStyle,
          announcementBar: synth.announcementBar,
          showAnnouncementBar: false,
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
          showPrices: true,
          showServiceButtons: false,
          clinicAddress: gbpAddress || doctor.address || "",
          customServices: synth.customServices,
          customFaqs: synth.customFaqs,
          customBio: synth.customBio,
          galleryImages: [],
          sections: synth.sections || [],
          metaTitle: synth.metaTitle,
          metaDescription: synth.metaDescription,
        },
        update: {
          siteTitle: synth.siteTitle,
          tagline: synth.tagline,
          whatsappNumber: synth.whatsappNumber,
          contactPhone: synth.contactPhone,
          contactEmail: synth.contactEmail,
          clinicAddress: gbpAddress || doctor.address || undefined,
          customServices: synth.customServices,
          customFaqs: synth.customFaqs,
          customBio: synth.customBio,
        },
      });
    }

    return NextResponse.json({
      website: existingWebsite,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        clinicName: doctor.clinicName,
        specialty: doctor.specialty,
        phone: doctor.phone,
        address: gbpAddress || doctor.address,
        city: doctor.city,
        image: doctor.image,
        workingHoursStart: doctor.workingHoursStart,
        workingHoursEnd: doctor.workingHoursEnd,
        daysOff: doctor.daysOff,
        services: doctor.serviceTypes,
        reviews: doctor.reviews,
        hasGbp: doctor.gbpAccounts.length > 0,
      },
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
      logoUrl,
      heroHeading,
      heroSubheading,
      heroImage,
      heroSliderImages,
      heroStyle = "IMAGE_ONLY",
      showHeroBookingForm = false,
      announcementBar,
      showAnnouncementBar = false,
      ctaButtonText = "Book Appointment",
      ctaButtonAction = "BOOKING_MODAL",
      primaryCtaLink,
      secondaryCtaText = "WhatsApp Chat",
      secondaryCtaAction = "WHATSAPP",
      secondaryCtaLink,
      whatsappNumber,
      contactPhone,
      contactEmail,
      showServices = true,
      showReviews = true,
      showDoctorBio = true,
      showFaq = true,
      showMap = true,
      showStickyBar = true,
      showPrices = true,
      showServiceButtons = false,
      clinicAddress,
      mapEmbedUrl,
      customServices,
      customFaqs,
      customBio,
      galleryImages,
      sections,
      metaTitle,
      metaDescription,
    } = body;

    const saved = await prisma.clinicWebsite.upsert({
      where: { doctorId },
      create: {
        doctorId,
        subdomain: subdomain.toLowerCase().trim(),
        themeId,
        primaryColor,
        secondaryColor,
        accentColor,
        fontHeading,
        fontBody,
        siteTitle: siteTitle || "Clinic",
        tagline,
        logoUrl,
        heroHeading: heroHeading || "Comprehensive Healthcare",
        heroSubheading: heroSubheading || "",
        heroImage,
        heroSliderImages: heroSliderImages || [],
        heroStyle,
        showHeroBookingForm,
        announcementBar: announcementBar || "",
        showAnnouncementBar: showAnnouncementBar === true,
        ctaButtonText,
        ctaButtonAction,
        primaryCtaLink,
        secondaryCtaText,
        secondaryCtaAction,
        secondaryCtaLink,
        whatsappNumber,
        contactPhone,
        contactEmail,
        showServices,
        showReviews,
        showDoctorBio,
        showFaq,
        showMap,
        showStickyBar,
        showPrices,
        showServiceButtons,
        clinicAddress,
        mapEmbedUrl,
        customServices: customServices || [],
        customFaqs: customFaqs || [],
        customBio,
        galleryImages: galleryImages || [],
        sections: sections || [],
        metaTitle: metaTitle || siteTitle,
        metaDescription,
      },
      update: {
        subdomain: subdomain.toLowerCase().trim(),
        themeId,
        primaryColor,
        secondaryColor,
        accentColor,
        fontHeading,
        fontBody,
        siteTitle: siteTitle || "Clinic",
        tagline,
        logoUrl,
        heroHeading: heroHeading || "Comprehensive Healthcare",
        heroSubheading: heroSubheading || "",
        heroImage,
        heroSliderImages: heroSliderImages || [],
        heroStyle,
        showHeroBookingForm,
        announcementBar: announcementBar || "",
        showAnnouncementBar: showAnnouncementBar === true,
        ctaButtonText,
        ctaButtonAction,
        primaryCtaLink,
        secondaryCtaText,
        secondaryCtaAction,
        secondaryCtaLink,
        whatsappNumber,
        contactPhone,
        contactEmail,
        showServices,
        showReviews,
        showDoctorBio,
        showFaq,
        showMap,
        showStickyBar,
        showPrices,
        showServiceButtons,
        clinicAddress,
        mapEmbedUrl,
        customServices: customServices || [],
        customFaqs: customFaqs || [],
        customBio,
        galleryImages: galleryImages || [],
        sections: sections || [],
        metaTitle: metaTitle || siteTitle,
        metaDescription,
      },
    });

    return NextResponse.json({ success: true, website: saved });
  } catch (error: any) {
    console.error("[WEBSITE API SAVE ERROR]:", error);
    return NextResponse.json({ error: error.message || "Failed to save website" }, { status: 500 });
  }
}
