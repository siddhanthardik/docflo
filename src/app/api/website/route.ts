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

    // Extract detailed GBP address & business name
    const gbpAccount = doctor.gbpAccounts[0];
    const gbpSnapshot = gbpAccount?.profileSnapshots?.[0];
    const snapshotJson = (gbpSnapshot?.json as any) || {};
    const businessName = snapshotJson.businessName || doctor.clinicName || doctor.name || "Clinic";
    const gbpAddress = snapshotJson.formattedAddress || snapshotJson.address || (snapshotJson.storefrontAddress?.addressLines?.join(", ")) || doctor.address || "";
    
    // Auto-generate accurate Google Map pin URL
    const fullPinQuery = `${businessName} ${gbpAddress}`.trim();
    const autoMapEmbedUrl = fullPinQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(fullPinQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed` : null;

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
          buttonRadius: "2xl",
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
          showAppointmentPage: true,
          clinicAddress: gbpAddress || doctor.address || "",
          mapEmbedUrl: autoMapEmbedUrl,
          customServices: synth.customServices,
          customFaqs: synth.customFaqs,
          customBio: synth.customBio,
          doctorInfo: {
            name: doctor.name,
            specialty: doctor.specialty || "",
            degrees: doctor.degrees || "",
            designation: doctor.designation || "",
            image: doctor.image || "",
          },
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
          mapEmbedUrl: autoMapEmbedUrl || undefined,
          customServices: synth.customServices,
          customFaqs: synth.customFaqs,
          customBio: synth.customBio,
        },
      });
    }

    const savedDoctorInfo = (existingWebsite.doctorInfo as any) || {};

    return NextResponse.json({
      website: existingWebsite,
      doctor: {
        id: doctor.id,
        name: savedDoctorInfo.name || doctor.name || "Doctor",
        clinicName: doctor.clinicName,
        specialty: savedDoctorInfo.specialty || doctor.specialty || "",
        degrees: savedDoctorInfo.degrees || doctor.degrees || "",
        designation: savedDoctorInfo.designation || doctor.designation || "",
        phone: doctor.phone,
        address: existingWebsite.clinicAddress || gbpAddress || doctor.address,
        city: doctor.city,
        image: savedDoctorInfo.image || doctor.image || "",
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
      buttonRadius = "2xl",
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
      showAppointmentPage = true,
      clinicAddress,
      mapEmbedUrl,
      navLinks,
      customServices,
      customFaqs,
      customBio,
      doctor,
      galleryImages,
      sections,
      metaTitle,
      metaDescription,
    } = body;

    // Update Doctor record in database
    if (doctor) {
      await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          name: doctor.name || undefined,
          specialty: doctor.specialty || undefined,
          degrees: doctor.degrees || undefined,
          designation: doctor.designation || undefined,
          image: doctor.image || undefined,
        },
      });
    }

    const doctorInfoToSave = doctor ? {
      name: doctor.name,
      specialty: doctor.specialty,
      degrees: doctor.degrees,
      designation: doctor.designation,
      image: doctor.image,
    } : undefined;

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
        buttonRadius,
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
        showAppointmentPage,
        clinicAddress,
        mapEmbedUrl,
        navLinks: navLinks || [],
        customServices: customServices || [],
        customFaqs: customFaqs || [],
        customBio,
        doctorInfo: doctorInfoToSave,
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
        buttonRadius,
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
        showAppointmentPage,
        clinicAddress,
        mapEmbedUrl,
        navLinks: navLinks || [],
        customServices: customServices || [],
        customFaqs: customFaqs || [],
        customBio,
        doctorInfo: doctorInfoToSave,
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
