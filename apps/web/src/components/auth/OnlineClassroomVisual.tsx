"use client";

import { motion } from "framer-motion";
import { GraduationCap, Rocket, Sprout } from "lucide-react";

const pillars = [
  {
    title: "Learn",
    detail: "Expert instructors & structured lessons",
    icon: GraduationCap,
  },
  {
    title: "Grow",
    detail: "Practical skills & continuous growth",
    icon: Sprout,
  },
  {
    title: "Build",
    detail: "Real projects & real-world experience",
    icon: Rocket,
  },
] as const;

export function OnlineClassroomVisual() {
  return (
    <div className="relative flex h-full min-h-[22rem] w-full items-center justify-center overflow-hidden bg-card lg:min-h-0">
      <motion.div
        className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-primary/12 blur-3xl"
        animate={{ x: [0, 20, 0], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-primary/8 blur-3xl"
        animate={{ x: [0, -16, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
        <motion.p
          className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Learn from highly respected instructors across the Somali learning
          community through practical, real-world education designed to turn
          knowledge into skills. Learn by doing, grow with confidence, and build
          the future you imagine.
        </motion.p>

        <ul className="mt-10 space-y-4">
          {pillars.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-border/70 bg-canvas px-4 py-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.1, duration: 0.45 }}
              >
                <motion.span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    delay: 0.9 + i * 0.2,
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </motion.span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-base font-bold text-primary">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
