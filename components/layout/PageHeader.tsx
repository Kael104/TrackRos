interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-12 lg:mb-16">
      <div className="mb-4 h-1 w-12 rounded-full bg-gradient-brand" />
      <h1 className="font-heading text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
        {description}
      </p>
    </header>
  );
}
