import { FeaturePlaceholder } from '../../features/placeholders/feature-placeholder';

export default function AssistantPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Workspace"
      title="Assistant"
      description="A grounded knowledge assistant will live here once retrieval and AI services are introduced in later phases."
      emptyTitle="No assistant session yet"
      emptyDescription="Chat behavior is intentionally unavailable while the retrieval pipeline is being built."
    />
  );
}
