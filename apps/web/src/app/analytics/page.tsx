import { FeaturePlaceholder } from '../../features/placeholders/feature-placeholder';

export default function AnalyticsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Operations"
      title="Analytics"
      description="Usage, retrieval quality, latency, and cost reporting will be added when live activity exists."
      emptyTitle="No analytics available"
      emptyDescription="This page is ready for real operational metrics in a later phase."
    />
  );
}
