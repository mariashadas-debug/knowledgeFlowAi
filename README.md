# KnowledgeFlow AI

KnowledgeFlow AI is an internal company knowledge assistant designed to demonstrate a
production-minded full-stack retrieval-augmented generation architecture.

## Current status

Phases 1 through 8 establish the npm workspace, local PostgreSQL with pgvector, the HTTP API,
the Next.js shell, document management, text extraction/chunking, and embedding storage.
Semantic retrieval and RAG answers are intentionally introduced in later phases.

## Workspace

- `apps/web` — Next.js frontend boundary (implemented in Phase 5)
- `apps/api` — Node.js REST API boundary (implemented starting in Phase 3)
- `packages/shared` — framework-independent shared contracts
- `docker` — supporting container configuration
- `docs` — architecture, RAG, and security documentation

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Phase 1 checks

```bash
npm install
npm run check
```

## Local API

Copy the environment template, then start the API in watch mode:

```powershell
Copy-Item .env.example .env
npm run dev:api
```

The API verifies PostgreSQL connectivity before listening on `http://localhost:3001` by default.
Its health endpoint checks the database with a lightweight query:

```text
GET http://localhost:3001/health
```

## Local web application

Set `NEXT_PUBLIC_API_URL` in `.env` to the API origin (the local default is
`http://localhost:3001`), then start the frontend:

```powershell
npm run dev:web
```

The web application runs at `http://localhost:3000`. Available routes are `/`, `/assistant`,
`/documents`, `/conversations`, `/analytics`, and `/settings`. The dashboard proxies the API
health check through its own `/api/health` route so the browser does not require cross-origin
configuration.

## Document uploads

The Documents page accepts PDF, TXT, MD, and MARKDOWN files. The default limit is 10 MB and can
be changed with `MAX_UPLOAD_SIZE_MB`. Uploaded bytes are stored locally under the directory
configured by `STORAGE_DIRECTORY` (`storage/documents` by default); only metadata and a private
storage key are kept in PostgreSQL. Stored files are ignored by Git.

After storage, TXT, Markdown, and text-based PDF files are extracted, normalized, and chunked.
Documents move from `processing` to `ready`, or to `failed` with a safe error message. Scanned or
image-only PDFs are not supported because Phase 7 does not include OCR.

Chunks target `CHUNK_SIZE=1200` characters with `CHUNK_OVERLAP=200` characters by default.
Splits prefer headings, paragraphs, and sentences, falling back to whitespace or a hard boundary
only when necessary. Configure both values in `.env`; overlap must remain smaller than chunk
size.

## Embeddings

An embedding is a numeric representation of chunk content that is stored in PostgreSQL's
`vector(1536)` column. Phase 8 generates and stores these vectors but does not yet expose semantic
search or RAG answers.

Local development and automated tests default to `AI_PROVIDER=mock`. The mock provider hashes
each input into a deterministic 1536-dimensional vector, so identical text produces identical
results without network access or usage cost. Set `AI_PROVIDER=openai` and provide a server-only
`OPENAI_API_KEY` to use `text-embedding-3-small`. Never prefix the key with `NEXT_PUBLIC_`.

Embeddings are generated in ordered batches of `EMBEDDING_BATCH_SIZE=32`. Inputs longer than
`EMBEDDING_MAX_INPUT_CHARACTERS=12000` are rejected defensively, and OpenAI requests time out
after `OPENAI_TIMEOUT_MS=30000` by default. A document becomes ready only after every chunk has a
valid 1536-dimensional embedding and the complete replacement has committed transactionally.

## Local database

PostgreSQL 16 and pgvector run in Docker, so PostgreSQL does not need to be installed on the
host. On Windows, copy the development environment template and start the service from
PowerShell:

```powershell
Copy-Item .env.example .env
npm run db:up
docker compose ps
npm run db:migrate
npm run db:migrate:status
```

Migrations are stored in `apps/api/migrations`. The initial schema contains `documents`,
`document_chunks`, `conversations`, `messages`, and `ai_request_logs`. To roll back only the most
recent migration during local development, run `npm run db:migrate:down`.

`document_chunks.embedding` uses the configured contract `vector(1536)`. Vector ANN
indexes are intentionally deferred until the corpus and retrieval behavior justify choosing and
tuning HNSW or IVFFlat; exact search is preferable for the initial small dataset.

The committed credentials are development-only defaults. Replace them in `.env` outside local
development. Applications running on the host connect through `localhost` using `DATABASE_URL`.
An application running as another Compose service would instead use the service hostname
`postgres`, for example:

```text
postgresql://knowledgeflow:knowledgeflow_dev@postgres:5432/knowledgeflow
```

Verify that the extension is installed:

```powershell
docker compose exec postgres psql -U knowledgeflow -d knowledgeflow -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"
```

Use `npm run db:down` to stop containers while preserving data. Running
`docker compose down -v` also deletes the named development database volume and all data stored
in it.
