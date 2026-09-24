import { motion } from "framer-motion";
import img1 from "@/assets/inspiration-1.jpg";
import img2 from "@/assets/inspiration-2.jpg";
import img3 from "@/assets/inspiration-3.jpg";
import img4 from "@/assets/inspiration-4.jpg";
import img5 from "@/assets/inspiration-5.jpg";
import img6 from "@/assets/inspiration-6.jpg";

const cards = [
  { src: img1, alt: "Warm plaster archway", x: "-42%", y: "-12%", r: -8, w: 180, delay: 0 },
  { src: img2, alt: "Draped linen fabric", x: "-8%", y: "-28%", r: 4, w: 220, delay: 0.15 },
  { src: img3, alt: "Terracotta ceramic curve", x: "28%", y: "-8%", r: 9, w: 170, delay: 0.3 },
  { src: img4, alt: "Modernist architecture", x: "38%", y: "18%", r: -5, w: 210, delay: 0.45 },
  { src: img5, alt: "Editorial book spread", x: "-32%", y: "22%", r: 6, w: 175, delay: 0.6 },
  { src: img6, alt: "Sculptural ceramic vessel", x: "6%", y: "26%", r: -4, w: 190, delay: 0.75 },
];

export function InspirationConstellation() {
  return (
    <div className="relative mx-auto h-[560px] w-full max-w-5xl">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-[520px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-orbit size-[520px] rounded-full border border-dashed border-foreground/10" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="animate-orbit size-[360px] rounded-full border border-dashed border-accent/20"
          style={{ animationDirection: "reverse", animationDuration: "60s" }}
        />
      </div>

      {/* Center DNA node */}
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="relative grid size-40 place-items-center rounded-full border border-border bg-background/80 backdrop-blur-xl shadow-elegant">
          <div className="text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent">
              Extracting
            </p>
            <p className="mt-2 font-display text-3xl italic">Style DNA</p>
            <div className="mt-3 flex justify-center gap-1">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              <span className="size-1.5 rounded-full bg-accent/60 animate-pulse [animation-delay:200ms]" />
              <span className="size-1.5 rounded-full bg-accent/30 animate-pulse [animation-delay:400ms]" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      {cards.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: c.delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-1/2 top-1/2 z-10"
          style={{
            transform: `translate(calc(-50% + ${c.x}), calc(-50% + ${c.y}))`,
          }}
        >
          <div
            className="animate-drift rounded-2xl bg-background p-1.5 shadow-float ring-1 ring-border"
            style={{ ["--r" as string]: `${c.r}deg`, animationDelay: `${i * 0.8}s` }}
          >
            <img
              src={c.src}
              alt={c.alt}
              width={c.w}
              height={c.w * 1.25}
              className="rounded-xl object-cover"
              style={{ width: c.w, height: c.w * 1.25 }}
            />
          </div>
        </motion.div>
      ))}

      {/* Connecting lines (SVG) */}
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-30"
        viewBox="0 0 1000 560"
        preserveAspectRatio="none"
        aria-hidden
      >
        {[
          [80, 130],
          [340, 40],
          [720, 170],
          [780, 380],
          [220, 400],
          [520, 440],
        ].map(([x, y], i) => (
          <line
            key={i}
            x1={x}
            y1={y}
            x2="500"
            y2="280"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2 4"
            className="text-accent"
          />
        ))}
      </svg>
    </div>
  );
}
