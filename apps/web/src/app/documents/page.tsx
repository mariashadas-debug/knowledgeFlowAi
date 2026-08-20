import { FeaturePlaceholder } from '../../features/placeholders/feature-placeholder';

export default function DocumentsPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Knowledge base"
      title="Documents"
      description="This workspace will manage source documents and their processing state in a future phase."
      emptyTitle="No documents to display"
      emptyDescription="Document upload and processing have not been enabled yet."
    />
  );
}
