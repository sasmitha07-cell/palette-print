export function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`max-w-3xl space-y-4 ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      {eyebrow ? <EyebrowLabel>{eyebrow}</EyebrowLabel> : null}
      <h2 className="font-display text-4xl leading-[1.05] italic text-balance md:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description ? (
        <p className="text-lg text-muted-foreground text-pretty">{description}</p>
      ) : null}
    </div>
  );
}
