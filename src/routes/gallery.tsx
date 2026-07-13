import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { EyebrowLabel } from "@/components/site/section-heading";
import img1 from "@/assets/inspiration-1.jpg";
import img2 from "@/assets/inspiration-2.jpg";
import img3 from "@/assets/inspiration-3.jpg";
import img4 from "@/assets/inspiration-4.jpg";
import img5 from "@/assets/inspiration-5.jpg";
import img6 from "@/assets/inspiration-6.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Palette Print" },
      {
        name: "description",
        content:
          "Explore inspirations, generated moodboards, and mockups created from Style DNA extractions.",
      },
      { property: "og:title", content: "Palette Print Gallery" },
      {
        property: "og:description",
        content:
          "A living exhibition of Style DNAs, moodboards, and generated design systems.",
      },
    ],
  }),
  component: GalleryPage,
});

const IMAGES = [img1, img2, img3, img4, img5, img6, img4, img1, img3, img5, img2, img6];
const FILTERS = ["All", "Inspirations", "Moodboards", "Mockups", "DNAs"];

function GalleryPage() {
  return (
    <div className="overflow-hidden">
      <section className="px-6 pb-12 pt-20">
        <div className="mx-auto max-w-7xl">
          <EyebrowLabel>Gallery</EyebrowLabel>
          <div className="mt-6 flex flex-col items-end justify-between gap-6 md:flex-row">
            <h1 className="max-w-3xl font-display text-6xl italic leading-[1.05]">
              A living exhibition <em>of taste</em>
            </h1>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f, i) => (
                <button
                  key={f}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                    i === 0
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background hover:bg-bone"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
          {IMAGES.map((src, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.04, duration: 0.6 }}
              className={`group relative overflow-hidden rounded-2xl border border-border ${
                i % 5 === 0 ? "row-span-2" : ""
              }`}
            >
              <img
                src={src}
                alt="Gallery item"
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ aspectRatio: i % 5 === 0 ? "3/4" : "1/1" }}
              />
              <figcaption className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-background/85 px-3 py-1.5 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                <span className="font-mono text-[9px] uppercase tracking-widest">
                  Editorial Modernist
                </span>
                <span className="font-display text-xs italic text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>
    </div>
  );
}
