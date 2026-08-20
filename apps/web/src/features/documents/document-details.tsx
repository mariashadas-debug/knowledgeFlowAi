'use client';

import Link from 'next/link';

import type { DocumentStatus } from '../../types/documents';
import { useDocument, useDocumentChunks } from './use-documents';

function statusClasses(status: DocumentStatus): string {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  if (status === 'failed') return 'bg-rose-50 text-rose-700 ring-rose-600/20';
  return 'bg-amber-50 text-amber-700 ring-amber-600/20';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetails({ documentId }: { documentId: string }) {
  const document = useDocument(documentId);
  const chunks = useDocumentChunks(documentId, document.isSuccess);

  if (document.isPending) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
        Loading document details…
      </div>
    );
  }

  if (document.isError) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-8">
        <h1 className="text-lg font-semibold text-rose-900">Unable to load document</h1>
        <p className="mt-2 text-sm text-rose-700">{document.error.message}</p>
        <Link
          href="/documents"
          className="mt-5 inline-block text-sm font-semibold text-rose-800 underline"
        >
          Back to documents
        </Link>
      </div>
    );
  }

  const item = document.data;
  const extension = item.originalName.split('.').pop()?.toUpperCase() ?? item.mimeType;

  return (
    <>
      <header className="mb-8 border-b border-slate-200 pb-7">
        <Link href="/documents" className="text-sm font-medium text-brand-600 hover:underline">
          ← Documents
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {item.originalName}
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusClasses(item.status)}`}
          >
            {item.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {extension} · {formatSize(item.size)} · Uploaded{' '}
          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
            new Date(item.createdAt),
          )}
        </p>
        {item.status === 'failed' && item.errorMessage ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {item.errorMessage}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="chunks-heading">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="chunks-heading" className="text-base font-semibold text-slate-950">
              Extracted chunks
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Normalized text prepared for future embedding.
            </p>
          </div>
          {chunks.data ? (
            <span className="text-xs text-slate-500">{chunks.data.length} chunks</span>
          ) : null}
        </div>

        {chunks.isPending ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
            Loading extracted chunks…
          </div>
        ) : chunks.isError ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700"
          >
            Unable to load extracted chunks: {chunks.error.message}
          </div>
        ) : chunks.data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
            {item.status === 'processing'
              ? 'Text extraction is still processing.'
              : 'No extracted chunks are available for this document.'}
          </div>
        ) : (
          <div className="space-y-3">
            {chunks.data.map((chunk) => (
              <details key={chunk.id} className="group rounded-xl border border-slate-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                  <span>
                    Chunk {chunk.chunkIndex + 1}
                    {chunk.metadata.heading ? ` · ${chunk.metadata.heading}` : ''}
                  </span>
                  <span className="text-xs font-normal text-slate-500">
                    {chunk.metadata.pageNumber ? `Page ${chunk.metadata.pageNumber} · ` : ''}
                    {chunk.content.length} characters
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-5 py-4">
                  <pre className="overflow-x-auto whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">
                    {chunk.content}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
