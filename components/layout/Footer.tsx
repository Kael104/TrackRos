export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border-subtle bg-surface">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-accent opacity-40"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row lg:px-8">
        <p className="text-sm text-text-muted">
          &copy; {year} Trackros. All rights reserved.
        </p>
        <p className="text-sm text-text-muted">
          Macro &amp; nutrient tracking, simplified.
        </p>
      </div>
    </footer>
  );
}
