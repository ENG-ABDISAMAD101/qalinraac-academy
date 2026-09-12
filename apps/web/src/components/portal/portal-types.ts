import type { LucideIcon } from "lucide-react";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
};

export type PortalNavSection = {
  title: string;
  items: PortalNavItem[];
};
