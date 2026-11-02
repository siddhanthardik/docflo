import { ReactNode } from "react";
import { PageSection, SectionType } from "@/components/themes/theme-types";

export type BlockTier = "blocks" | "design-blocks" | "saved-blocks";
export type BlockSubTab = "primitives" | "gyrex-blocks";

export interface PrimitiveBlockDefinition {
  id: string;
  name: string;
  category: "Layout" | "Basic" | "Typography" | "Media" | "Forms" | "Extra" | "Interactive";
  iconName: string;
  description: string;
  defaultSection: () => Partial<PageSection>;
}

export interface GyrexClinicalBlockDefinition {
  id: string;
  type: SectionType;
  name: string;
  category: "Clinical Core" | "Social Proof" | "Conversion" | "Information";
  badge?: string;
  iconName: string;
  description: string;
  defaultSection: () => Partial<PageSection>;
}

export interface DesignBlockDefinition {
  id: string;
  name: string;
  category: "Features" | "Hero Banners" | "Clinical Services" | "Checkup Packages" | "Trust & Reviews" | "Conversion CTA" | "FAQ & Contact" | "About Specialist";
  badge?: string;
  targetType: SectionType;
  description: string;
  tags: string[];
  thumbnailVariant:
    | "split"
    | "full"
    | "bento"
    | "grid"
    | "cards"
    | "ribbon"
    | "faq"
    | "map"
    | "features-center"
    | "features-tree"
    | "features-side"
    | "features-cards"
    | "features-badges"
    | "features-columns";
  defaultSection: () => Partial<PageSection>;
}

export interface SavedBlockItem {
  id: string;
  name: string;
  description?: string;
  targetType: SectionType;
  createdAt: string;
  section: PageSection;
}
