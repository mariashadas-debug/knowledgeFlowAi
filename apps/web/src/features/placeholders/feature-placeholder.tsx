import { EmptyState } from '../../components/empty-state';
import { PageHeader } from '../../components/page-header';

interface FeaturePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: FeaturePlaceholderProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </>
  );
}
