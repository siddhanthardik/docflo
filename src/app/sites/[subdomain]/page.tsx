import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ThemeRenderer } from "@/components/themes/ThemeRenderer";
import { ClinicWebsiteData } from "@/components/themes/theme-types";

export const revalidate = 60; // ISR cache

interface SitePageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const site = await prisma.clinicWebsite.findUnique({
    where: { subdomain: subdomain.toLowerCase() },
    include: { doctor: true },
  });

  if (!site) {
    return { title: "Clinic Website Not Found | Gyrex" };
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
      url: `https://${site.subdomain}.gyrex.in`,
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

export default async function PublicSubdomainSitePage({ params }: SitePageProps) {
  const { subdomain } = await params;
  const site = await prisma.clinicWebsite.findUnique({
    where: { subdomain: subdomain.toLowerCase() },
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

  // Increment view counter in background
  prisma.clinicWebsite
    .update({
      where: { id: site.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  const shapedData: ClinicWebsiteData = {
    id: site.id,
    subdomain: site.subdomain,
    themeId: site.themeId,
    primaryColor: site.primaryColor,
    secondaryColor: site.secondaryColor,
    accentColor: site.accentColor,
    fontHeading: site.fontHeading,
    fontBody: site.fontBody,
    siteTitle: site.siteTitle,
    tagline: site.tagline,
    heroHeading: site.heroHeading,
    heroSubheading: site.heroSubheading,
    heroImage: site.heroImage,
    heroStyle: site.heroStyle,
    announcementBar: site.announcementBar,
    ctaButtonText: site.ctaButtonText,
    ctaButtonAction: site.ctaButtonAction,
    whatsappNumber: site.whatsappNumber,
    contactPhone: site.contactPhone,
    contactEmail: site.contactEmail,
    showServices: site.showServices,
    showReviews: site.showReviews,
    showDoctorBio: site.showDoctorBio,
    showFaq: site.showFaq,
    showMap: site.showMap,
    showStickyBar: site.showStickyBar,
    customServices: (site.customServices as any) || site.doctor?.serviceTypes.map((s) => ({ name: s.name, description: s.description || "" })),
    customFaqs: (site.customFaqs as any) || [],
    customBio: site.customBio,
    doctor: site.doctor
      ? {
          name: site.doctor.name,
          clinicName: site.doctor.clinicName,
          specialty: site.doctor.specialty,
          phone: site.doctor.phone,
          address: site.doctor.address,
          city: site.doctor.city,
          image: site.doctor.image,
          workingHoursStart: site.doctor.workingHoursStart,
          workingHoursEnd: site.doctor.workingHoursEnd,
          daysOff: site.doctor.daysOff,
        }
      : undefined,
    reviews: site.doctor?.reviews.map((r) => ({
      reviewerName: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      reviewDate: r.reviewDate.toLocaleDateString("en-IN"),
    })) || [],
  };

  // Structured Data Schema
  const medicalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: site.siteTitle,
    description: site.heroSubheading,
    url: `https://${site.subdomain}.gyrex.in`,
    telephone: site.contactPhone || site.doctor?.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.doctor?.address || "",
      addressLocality: site.doctor?.city || "New Delhi",
      addressCountry: "IN",
    },
    openingHours: `Mo-Sa ${site.doctor?.workingHoursStart || "09:00"}-${site.doctor?.workingHoursEnd || "20:00"}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalBusinessSchema) }}
      />
      <ThemeRenderer data={shapedData} />
    </>
  );
}
