import { FeaturePlaceholder } from '../../features/placeholders/feature-placeholder';

export default function SettingsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Administration"
      title="Settings"
      description="Workspace-level configuration and provider settings will be managed here when those capabilities exist."
      emptyTitle="No configurable settings"
      emptyDescription="The current foundation uses environment-based configuration only."
    />
  );
}
