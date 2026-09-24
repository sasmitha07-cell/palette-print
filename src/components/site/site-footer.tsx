import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border bg-bone/40 px-6 pb-12 pt-24">
      <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-accent/10">
              <span className="size-3 rounded-full bg-accent" />
            </span>
            <span className="font-display text-2xl italic">Palette Print</span>
          </div>
          <p className="max-w-[280px] text-sm text-muted-foreground">
            The creative intelligence platform for designers, founders, and studios. Capturing the
            unseen frequency of aesthetic preference.
          </p>
          <div className="flex gap-2">
            {["Twitter", "Are.na", "Instagram", "Dribbble"].map((s) => (
              <a
                key={s}
                href="#"
                className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium transition-colors hover:border-accent hover:text-accent"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          heading="Platform"
          links={[
            { to: "/style-dna", label: "Style DNA" },
            { to: "/ai-studio", label: "AI Studio" },
            { to: "/gallery", label: "Gallery" },
            { to: "/marketplace", label: "Marketplace" },
          ]}
        />
        <FooterCol
          heading="Product"
          links={[
            { to: "/how-it-works", label: "How It Works" },
            { to: "/pricing", label: "Pricing" },
            { to: "/style-dna", label: "Extract DNA" },
          ]}
        />
        <FooterCol
          heading="Studio"
          links={[
            { to: "/", label: "Manifesto" },
            { to: "/", label: "Journal" },
            { to: "/", label: "Careers" },
            { to: "/", label: "Contact" },
          ]}
        />
      </div>

      <div className="mx-auto mt-24 flex max-w-7xl flex-col items-start justify-between gap-4 border-t border-border pt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground md:flex-row md:items-center">
        <span>© 2026 Palette Print Systems · Refracting Creativity</span>
        <span>Designed with Intention · v2.0</span>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div className="space-y-5">
      <h5 className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">{heading}</h5>
      <ul className="space-y-3">
        {links.map((l, i) => (
          <li key={`${l.label}-${i}`}>
            <Link
              to={l.to}
              className="text-sm text-foreground/70 transition-colors hover:text-accent"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
