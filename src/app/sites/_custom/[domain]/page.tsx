import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ThemeRenderer } from "@/components/themes/ThemeRenderer";
import { ClinicWebsiteData } from "@/components/themes/theme-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CustomSitePageProps {
  params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: CustomSitePageProps): Promise<Metadata> {
  const { domain } = await params;
  const site = await prisma.clinicWebsite.findUnique({
    where: { customDomain: domain.toLowerCase() },
    include: { doctor: true },
  });

  if (!site) {
    return { title: "Domain Not Configured | Gyrex" };
  }

  const title = site.metaTitle || `${site.siteTitle} | ${site.tagline || "Clinical Healthcare"}`;
  const description = site.metaDescription || site.heroSubheading || "Book a doctor consultation and explore medical treatments.";
  const image = site.ogImage || site.heroImage || "https://gyrex.in/og-image.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://${site.customDomain}`,
      siteName: site.siteTitle,
      images: [{ url: image }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function CustomDomainSitePage({ params }: CustomSitePageProps) {
  const { domain } = await params;
  const site = await prisma.clinicWebsite.findUnique({
    where: { customDomain: domain.toLowerCase() },
    include: {
      doctor: {
        include: {
          reviews: { orderBy: { reviewDate: "desc" }, take: 6 },
          serviceTypes: { where: { isActive: true } },
        },
      },
    },
  });

  if (!site || !site.isPublished) {
    notFound();
  }

  const doctorInfo = (site.doctorInfo as any) || {};

  const websiteData: ClinicWebsiteData = {
    id: site.id,
    subdomain: site.subdomain,
    customDomain: site.customDomain,
    themeId: site.themeId,
    primaryColor: site.primaryColor,
    secondaryColor: site.secondaryColor,
    accentColor: site.accentColor,
    fontHeading: site.fontHeading,
    fontBody: site.fontBody,
    buttonRadius: site.buttonRadius,
    siteTitle: site.siteTitle,
    tagline: site.tagline,
    logoUrl: site.logoUrl,
    heroHeading: site.heroHeading,
    heroSubheading: site.heroSubheading,
    heroImage: site.heroImage,
    heroSliderImages: (site.heroSliderImages as string[]) || [],
    heroStyle: site.heroStyle,
    showHeroBookingForm: site.showHeroBookingForm,
    announcementBar: site.announcementBar,
    showAnnouncementBar: site.showAnnouncementBar,
    ctaButtonText: site.ctaButtonText,
    ctaButtonAction: site.ctaButtonAction,
    primaryCtaLink: site.primaryCtaLink,
    secondaryCtaText: site.secondaryCtaText,
    secondaryCtaAction: site.secondaryCtaAction,
    secondaryCtaLink: site.secondaryCtaLink,
    whatsappNumber: site.whatsappNumber || site.doctor?.phone,
    contactPhone: site.contactPhone || site.doctor?.phone,
    contactEmail: site.contactEmail,
    showServices: site.showServices,
    showReviews: site.showReviews,
    showDoctorBio: site.showDoctorBio,
    showFaq: site.showFaq,
    showMap: site.showMap,
    showStickyBar: site.showStickyBar,
    showPrices: site.showPrices,
    showServiceButtons: site.showServiceButtons,
    showAppointmentPage: site.showAppointmentPage,
    clinicAddress: site.clinicAddress || site.doctor?.address,
    mapEmbedUrl: site.mapEmbedUrl,
    navLinks: (site.navLinks as any) || undefined,
    customServices: (site.customServices as any) || undefined,
    customFaqs: (site.customFaqs as any) || undefined,
    customBio: site.customBio,
    galleryImages: (site.galleryImages as any) || undefined,
    sections: (site.sections as any) || undefined,
    metaTitle: site.metaTitle,
    metaDescription: site.metaDescription,
    doctor: {
      name: doctorInfo.name || site.doctor?.name || "Doctor",
      clinicName: site.doctor?.clinicName,
      specialty: doctorInfo.specialty || site.doctor?.specialty || "",
      degrees: doctorInfo.degrees || site.doctor?.degrees || "",
      designation: doctorInfo.designation || site.doctor?.designation || "",
      phone: site.doctor?.phone,
      address: site.clinicAddress || site.doctor?.address,
      city: site.doctor?.city,
      image: doctorInfo.image || site.doctor?.image,
      workingHoursStart: site.doctor?.workingHoursStart,
      workingHoursEnd: site.doctor?.workingHoursEnd,
      daysOff: site.doctor?.daysOff,
    },
    reviews: site.doctor?.reviews?.map((r) => ({
      reviewerName: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      reviewDate: r.reviewDate,
    })) || [],
  };

  return <ThemeRenderer data={websiteData} previewMode={false} />;
}
