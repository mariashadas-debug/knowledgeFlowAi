'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

import type { ConversationMessage, RagSource } from '../../types/conversations';
import {
  useConversation,
  useConversations,
  useCreateConversation,
  useSendMessage,
} from './use-conversations';

function Sources({ sources }: { sources: RagSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Sources</p>
      <div className="mt-2 space-y-2">
        {sources.map((source, index) => (
          <details key={source.chunkId} className="rounded-lg border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-800">
              [S{index + 1}] {source.documentName} · chunk {source.chunkIndex + 1}
            </summary>
            <div className="border-t border-slate-200 px-3 py-3 text-xs leading-5 text-slate-600">
              <p>{source.excerpt}</p>
              <p className="mt-2 font-medium text-slate-500">
                Similarity {(source.score * 100).toFixed(1)}%
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function MessageCard({ message }: { message: ConversationMessage }) {
  const assistant = message.role === 'assistant';
  const sources = message.metadata.sources ?? [];
  const rag = message.metadata.rag;
  return (
    <article className={`flex ${assistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-3xl rounded-xl px-4 py-3 text-sm leading-6 ${
          assistant ? 'border border-slate-200 bg-white text-slate-800' : 'bg-slate-900 text-white'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {assistant ? <Sources sources={sources} /> : null}
        {assistant && rag ? (
          <details className="mt-3 text-xs text-slate-500">
            <summary className="cursor-pointer font-medium">RAG details</summary>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
              <dt>Model</dt>
              <dd>{rag.model}</dd>
              <dt>Latency</dt>
              <dd>{rag.latencyMs} ms</dd>
              <dt>Input tokens</dt>
              <dd>{rag.promptTokens ?? 'Not reported'}</dd>
              <dt>Output tokens</dt>
              <dd>{rag.completionTokens ?? 'Not reported'}</dd>
            </dl>
          </details>
        ) : null}
      </div>
    </article>
  );
}

export function AssistantWorkspace() {
  const conversations = useConversations();
  const create = useCreateConversation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const detail = useConversation(activeId);
  const send = useSendMessage();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId && conversations.data?.[0]) setActiveId(conversations.data[0].id);
  }, [activeId, conversations.data]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [detail.data?.messages.length, pendingQuestion]);

  async function newConversation() {
    const item = await create.mutateAsync();
    setActiveId(item.id);
    setDraft('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || send.isPending) return;
    let id = activeId;
    if (!id) {
      const conversation = await create.mutateAsync();
      id = conversation.id;
      setActiveId(id);
    }
    setDraft('');
    setPendingQuestion(message);
    try {
      await send.mutateAsync({ id, message });
    } catch {
      setDraft(message);
    } finally {
      setPendingQuestion(null);
    }
  }

  const messages = detail.data?.messages ?? [];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50 p-4 lg:block">
        <button
          type="button"
          onClick={() => void newConversation()}
          disabled={create.isPending}
          className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          New conversation
        </button>
        <p className="mt-6 text-xs font-semibold tracking-wide text-slate-500 uppercase">History</p>
        <nav aria-label="Conversation history" className="mt-2 space-y-1">
          {conversations.data?.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setActiveId(conversation.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                activeId === conversation.id
                  ? 'bg-white font-medium text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <span className="block truncate">{conversation.title ?? 'New conversation'}</span>
              {conversation.latestMessage ? (
                <span className="mt-0.5 block truncate text-xs text-slate-400">
                  {conversation.latestMessage}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col" aria-label="AI Assistant">
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-semibold text-slate-950">Knowledge Assistant</h1>
              <p className="text-xs text-slate-500">
                Answers grounded in indexed company documents
              </p>
            </div>
            <button
              type="button"
              onClick={() => void newConversation()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium lg:hidden"
            >
              New
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-5">
          {detail.isError ? (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              {detail.error.message}
            </div>
          ) : null}
          {!activeId || (!detail.isPending && messages.length === 0) ? (
            <div className="mx-auto mt-20 max-w-md text-center">
              <h2 className="text-lg font-semibold text-slate-900">Ask your company knowledge</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start with a policy, delivery, security, or support question. Answers include the
                exact retrieved sources.
              </p>
            </div>
          ) : null}
          {detail.isPending && activeId ? (
            <p className="text-center text-sm text-slate-500">Loading conversation…</p>
          ) : null}
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
          {pendingQuestion ? (
            <MessageCard
              message={{
                id: 'pending-user',
                conversationId: activeId!,
                role: 'user',
                content: pendingQuestion,
                metadata: {},
                createdAt: new Date().toISOString(),
              }}
            />
          ) : null}
          {send.isPending ? (
            <div className="text-sm text-slate-500" role="status">
              Retrieving company knowledge and generating an answer…
            </div>
          ) : null}
          {send.isError ? (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {send.error.message}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(event) => void submit(event)}
          className="border-t border-slate-200 bg-white p-4"
        >
          <label htmlFor="assistant-message" className="sr-only">
            Ask a question
          </label>
          <div className="flex gap-3">
            <textarea
              id="assistant-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="Ask about company policies or procedures…"
              className="min-h-12 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={!draft.trim() || send.isPending || create.isPending}
              className="self-end rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
