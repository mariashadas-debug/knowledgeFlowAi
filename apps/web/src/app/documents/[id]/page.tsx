import { DocumentDetails } from '../../../features/documents/document-details';

interface DocumentDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailsPage({ params }: DocumentDetailsPageProps) {
  const { id } = await params;
  return <DocumentDetails documentId={id} />;
}
