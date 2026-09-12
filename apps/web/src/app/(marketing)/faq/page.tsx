import type { Metadata } from "next";
import Link from "next/link";
import {
  Container,
  CtaBanner,
  PageHero,
  Section,
} from "@/components/site/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { faqs } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Qalinraac Academy.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Questions, answered"
        description="Quick answers about the Academy, learning programs, services, and partnerships."
        actions={
          <Button asChild variant="outline">
            <Link href="/contact">Still need help? Contact us</Link>
          </Button>
        }
      />

      <Section>
        <Container>
          <Accordion type="single" collapsible className="mx-auto max-w-3xl space-y-3">
            {faqs.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="px-4 py-4 text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      <CtaBanner />
    </>
  );
}
