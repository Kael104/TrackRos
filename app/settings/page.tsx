import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { GoalsForm } from "@/components/settings/GoalsForm";

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Goals & Settings"
        description="Set daily calorie and macro targets."
      />
      <GoalsForm />
    </PageContainer>
  );
}
