'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';

import { EmptyState } from '../../components/empty-state';
import { PageHeader } from '../../components/page-header';
import type { Document, DocumentStatus } from '../../types/documents';
import { useDeleteDocument, useDocuments, useUploadDocument } from './use-documents';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function fileType(document: Document): string {
  const extension = document.originalName.split('.').pop();
  return extension?.toUpperCase() ?? document.mimeType;
}

function statusClasses(status: DocumentStatus): string {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  if (status === 'failed') return 'bg-rose-50 text-rose-700 ring-rose-600/20';
  return 'bg-amber-50 text-amber-700 ring-amber-600/20';
}

export function DocumentsWorkspace() {
  const documents = useDocuments();
  const upload = useUploadDocument();
  const deletion = useDeleteDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submitUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) return;

    upload.mutate(selectedFile, {
      onSuccess: () => {
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = '';
      },
    });
  };

  const confirmDelete = (id: string) => {
    deletion.mutate(id, {
      onSuccess: () => setConfirmingId(null),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Knowledge base"
        title="Documents"
        description="Upload source material and monitor its processing state. Extraction and indexing begin in Phase 7."
      />

      <section className="mb-7 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Upload document</h2>
            <p className="mt-1 text-sm text-slate-500">PDF, TXT, MD, or MARKDOWN up to 10 MB.</p>
          </div>
          <form
            onSubmit={submitUpload}
            className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto"
          >
            <label className="min-w-0 flex-1 lg:w-80">
              <span className="sr-only">Choose document</span>
              <input
                ref={inputRef}
                name="file"
                type="file"
                accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600 file:mr-3 file:border-0 file:border-r file:border-slate-300 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
              />
            </label>
            <button
              type="submit"
              disabled={!selectedFile || upload.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {upload.isPending ? 'Uploading…' : 'Upload document'}
            </button>
          </form>
        </div>
        {upload.isError ? (
          <p role="alert" className="mt-4 text-sm font-medium text-rose-700">
            {upload.error.message}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="document-list-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="document-list-heading" className="text-sm font-semibold text-slate-900">
            Uploaded documents
          </h2>
          {documents.data ? (
            <span className="text-xs text-slate-500">
              {documents.data.length} {documents.data.length === 1 ? 'document' : 'documents'}
            </span>
          ) : null}
        </div>

        {documents.isPending ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
            Loading documents…
          </div>
        ) : documents.isError ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-8">
            <h3 className="font-semibold text-rose-900">Unable to load documents</h3>
            <p className="mt-1 text-sm text-rose-700">{documents.error.message}</p>
            <button
              type="button"
              onClick={() => documents.refetch()}
              className="mt-4 text-sm font-semibold text-rose-800 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : documents.data.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Upload company documentation to start building the knowledge base."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <table className="w-full min-w-3xl border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Size
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Uploaded
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.data.map((document) => (
                  <tr key={document.id} className="text-sm text-slate-600">
                    <td className="max-w-xs px-5 py-4">
                      <Link
                        href={`/documents/${document.id}`}
                        className="block truncate font-medium text-slate-900 hover:text-brand-600 hover:underline"
                      >
                        {document.originalName}
                      </Link>
                      {document.errorMessage ? (
                        <p className="mt-1 truncate text-xs text-rose-700">
                          {document.errorMessage}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">{fileType(document)}</td>
                    <td className="whitespace-nowrap px-4 py-4">{formatFileSize(document.size)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusClasses(document.status)}`}
                      >
                        {document.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {formatUploadedAt(document.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {confirmingId === document.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-500">Delete this file?</span>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deletion.isPending}
                            onClick={() => confirmDelete(document.id)}
                            className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            {deletion.isPending ? 'Deleting…' : 'Confirm'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/documents/${document.id}`}
                            className="text-sm font-medium text-brand-600 hover:underline"
                          >
                            Inspect
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(document.id)}
                            aria-label={`Delete ${document.originalName}`}
                            className="text-sm font-medium text-rose-700 hover:text-rose-900 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deletion.isError ? (
              <p
                role="alert"
                className="border-t border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700"
              >
                {deletion.error.message}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}
