import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <PageContainer>
      <PageHeader title={title} description={description} />

      <div className="rounded-xl border border-dashed border-neutral-200 bg-surface p-16 text-center shadow-soft">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle"
          aria-hidden="true"
        >
          <div className="h-6 w-6 rounded-md bg-gradient-brand opacity-60" />
        </div>
        <p className="font-heading text-base font-medium text-text-secondary">
          Content coming soon
        </p>
        <p className="mt-2 text-sm text-text-muted">
          This section will be built in a future iteration.
        </p>
      </div>
    </PageContainer>
  );
}
