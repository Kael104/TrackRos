interface PlaceholderSectionProps {
  id: string;
  title: string;
  description: string;
}

export function PlaceholderSection({
  id,
  title,
  description,
}: PlaceholderSectionProps) {
  return (
    <section
      id={id}
      className="group relative overflow-hidden rounded-xl border border-border bg-surface p-8 shadow-card transition-shadow duration-300 hover:shadow-elevated"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-accent opacity-80"
        aria-hidden="true"
      />

      <h2 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
        {title}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-text-secondary">
        {description}
      </p>

      <div
        className="mt-8 flex h-36 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-gradient-card-shine"
        aria-hidden="true"
      >
        <span className="text-sm font-medium text-text-muted">
          Component preview
        </span>
      </div>
    </section>
  );
}
