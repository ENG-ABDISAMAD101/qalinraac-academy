import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/ContactForm";
import {
  Container,
  PageHero,
  Section,
} from "@/components/site/Section";
import { site } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Qalinraac Academy for education, research, and partnership inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let’s work together"
        description="Reach out for learning programs, research support, language services, consulting, or institutional partnerships."
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Contact details
                </h2>
                <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <span>{site.address}</span>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <a
                      href={`mailto:${site.email}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {site.email}
                    </a>
                  </li>
                  <li className="flex gap-3">
                    <Phone className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <a
                      href={`tel:${site.phone.replace(/\s/g, "")}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {site.phone}
                    </a>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-canvas p-6">
                <p className="font-display text-lg font-semibold text-foreground">
                  {site.tagline}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Knowledge should be accessible. Research should create impact.
                  Education should empower people to build a better future.
                </p>
              </div>
            </div>
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
