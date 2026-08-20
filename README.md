# KnowledgeFlow AI

KnowledgeFlow AI is an internal company knowledge assistant designed to demonstrate a
production-minded full-stack retrieval-augmented generation architecture.

## Current status

Phases 1 through 4 establish the npm workspace, shared code-quality tooling, local PostgreSQL
with pgvector, the HTTP API, and the initial application schema. Document ingestion and the RAG
pipeline are intentionally introduced in later phases.

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

`document_chunks.embedding` uses the documented initial dimension `vector(1536)`. Vector ANN
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
