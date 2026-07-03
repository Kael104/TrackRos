import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { AppearanceCard } from "@/components/settings/AppearanceCard";
import { GoalsForm } from "@/components/settings/GoalsForm";

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Goals & Settings"
        description="Set daily targets and customize how Trackros looks."
      />
      <div className="space-y-8">
        <AppearanceCard />
        <GoalsForm />
      </div>
    </PageContainer>
  );
}
