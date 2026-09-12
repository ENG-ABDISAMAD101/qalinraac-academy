"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function OnlineClassroomVisual() {
  return (
    <div className="relative flex h-full min-h-[26rem] w-full items-center justify-center overflow-hidden bg-canvas text-foreground lg:min-h-0">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-8 right-8 h-40 w-40 rounded-full bg-primary/8 blur-3xl"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex w-full gap-10 max-w-2xl flex-col items-center px-6 py-12 sm:px-10 lg:px-12">
        <motion.p
          className="max-w-md mx-auto  text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Learn from highly respected instructors across the Somali learning
          community through practical, real-world education designed to turn
          knowledge into skills. Learn by doing, grow with confidence, and build
          the future you imagine.
        </motion.p>

        {/* Laptop — slight rotate left, no brand marks */}
        <motion.div
          className="relative mx-auto mt-10 w-[min(100%,28rem)] sm:w-[32rem]"
          initial={{ opacity: 0, y: 28, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -6 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "center center" }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Screen lid */}
            <div className="relative rounded-t-[1.1rem] border border-border/80 border-b-0 bg-card p-[0.55rem] pb-0 shadow-[0_30px_80px_-24px_rgba(17,24,39,0.4)] dark:shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-t-[0.7rem] bg-white">
                <Image
                  src="/qalinraac-acadmy-logo.jpeg"
                  alt="Qalinraac Academy"
                  fill
                  priority
                  sizes="(max-width: 640px) 420px, 520px"
                  className="object-contain object-center"
                />

                {/* Soft blur scan — no hard edge */}
                <motion.div
                  className="pointer-events-none absolute inset-y-0 z-10 w-[45%] blur-md"
                  initial={{ x: "-100%" }}
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{
                    duration: 5,
                    delay: 1,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 0.1,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent dark:via-white/20" />
                </motion.div>
              </div>
            </div>

            {/* Hinge */}
            <div className="relative h-2.5 bg-gradient-to-b from-border to-muted">
              <div className="absolute left-1/2 top-1/2 h-1 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/25" />
            </div>

            {/* Base / keyboard deck — unbranded */}
            <div className="relative mx-auto w-[108%] -translate-x-[3.7%] rounded-b-[0.9rem] border border-border/80 border-t-0 bg-card px-3 pb-3 pt-2 shadow-[0_18px_40px_-20px_rgba(17,24,39,0.45)]">
              <div className="mx-auto h-1.5 w-24 rounded-full bg-muted-foreground/20" />
              <div className="mt-2 h-2 rounded-sm bg-muted/80" />
            </div>

            <div className="mx-auto mt-5 h-3 w-[75%] rounded-full bg-foreground/15 blur-md" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
