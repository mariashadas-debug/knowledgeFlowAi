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
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Sources</p>
        <span className="text-xs text-slate-400">{sources.length} retrieved</span>
      </div>
      <div className="mt-2 space-y-2">
        {sources.map((source, index) => (
          <details
            key={source.chunkId}
            className="group rounded-lg border border-slate-200 bg-slate-50/80"
          >
            <summary className="flex list-none items-center justify-between gap-3 px-3.5 py-3 text-sm font-medium text-slate-800">
              <span className="min-w-0 truncate">
                <span className="mr-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700">
                  S{index + 1}
                </span>
                {source.documentName} · chunk {source.chunkIndex + 1}
              </span>
              <span className="shrink-0 text-xs font-normal text-slate-500">
                {(source.score * 100).toFixed(0)}% similarity
              </span>
            </summary>
            <div className="border-t border-slate-200 px-3.5 py-3 text-sm leading-6 text-slate-600">
              <p className="whitespace-pre-wrap">{source.excerpt}</p>
              <p className="mt-2 text-xs text-slate-400">
                Retrieval similarity indicates vector proximity, not model confidence.
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
      <div className={`w-full max-w-3xl ${assistant ? '' : 'flex justify-end'}`}>
        <div
          className={`rounded-2xl px-4 py-3.5 text-sm leading-6 shadow-sm ${
            assistant
              ? 'border border-slate-200 bg-white text-slate-800'
              : 'max-w-[85%] bg-ink-900 text-white'
          }`}
        >
          <p
            className={`mb-1 text-[11px] font-semibold tracking-wide uppercase ${assistant ? 'text-brand-600' : 'text-slate-300'}`}
          >
            {assistant ? 'KnowledgeFlow AI' : 'You'}
          </p>
          <p className="whitespace-pre-wrap">{message.content}</p>
          {assistant ? <Sources sources={sources} /> : null}
          {assistant && rag ? (
            <details className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-xs text-slate-500">
              <summary className="px-3 py-2.5 font-medium text-slate-600">
                Developer details
              </summary>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-200 px-3 py-3 sm:grid-cols-4">
                <dt>Model</dt>
                <dd>{rag.model}</dd>
                <dt>Latency</dt>
                <dd>{rag.latencyMs} ms</dd>
                <dt>Input tokens</dt>
                <dd>{rag.promptTokens ?? 'Not reported'}</dd>
                <dt>Output tokens</dt>
                <dd>{rag.completionTokens ?? 'Not reported'}</dd>
                <dt>Total tokens</dt>
                <dd>{rag.totalTokens ?? 'Not reported'}</dd>
                <dt>Retrieved chunks</dt>
                <dd>{sources.length}</dd>
              </dl>
            </details>
          ) : null}
        </div>
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
    <div className="flex min-h-[calc(100vh-7rem)] max-h-[calc(100vh-5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50/80 p-4 lg:block">
        <button
          type="button"
          onClick={() => void newConversation()}
          disabled={create.isPending}
          className="w-full rounded-lg bg-ink-900 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800 disabled:opacity-50"
        >
          New conversation
        </button>
        <p className="mt-6 text-xs font-semibold tracking-wide text-slate-500 uppercase">History</p>
        <nav
          aria-label="Conversation history"
          className="mt-2 max-h-[calc(100vh-14rem)] space-y-1 overflow-y-auto"
        >
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
        <header className="border-b border-slate-200 px-5 py-4 sm:px-7">
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

        <div className="flex-1 space-y-5 overflow-y-auto bg-[#fafbfc] p-4 sm:p-7">
          {detail.isError ? (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              {detail.error.message}
            </div>
          ) : null}
          {!activeId || (!detail.isPending && messages.length === 0) ? (
            <div className="mx-auto mt-12 max-w-xl text-center sm:mt-20">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-600">
                ✦
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                Ask a question about your company knowledge
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Responses are grounded in indexed documents and include inspectable source
                citations.
              </p>
              <div className="mt-6 grid gap-2 text-left sm:grid-cols-3">
                {[
                  'What does the refund policy say?',
                  'When is a package considered lost?',
                  'What should support do when tracking has not updated?',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setDraft(prompt)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-left text-xs leading-5 text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
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
          className="border-t border-slate-200 bg-white p-4 sm:px-7 sm:py-5"
        >
          <label htmlFor="assistant-message" className="sr-only">
            Ask a question
          </label>
          <div className="mx-auto flex max-w-4xl gap-3">
            <textarea
              id="assistant-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="Ask about company policies or procedures…"
              className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-3 text-sm shadow-inner focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={!draft.trim() || send.isPending || create.isPending}
              className="self-end rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
