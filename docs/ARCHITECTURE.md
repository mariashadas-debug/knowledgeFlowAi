# Architecture

## Database

The API uses a single `pg` connection pool created during startup and closed during graceful
shutdown. Schema changes are explicit `node-pg-migrate` migrations rather than application
startup side effects.

The initial `document_chunks.embedding` column is `vector(1536)`. No ANN index is created yet:
exact search is appropriate for the initial empty/small dataset, and the eventual index should
be chosen using measured corpus size and query behavior.

## Document storage

Document metadata lives in PostgreSQL while uploaded bytes live behind a storage interface. The
current implementation writes server-generated keys to `storage/documents`; route responses
never expose those keys or filesystem paths. This boundary can later be replaced with object
storage without moving SQL into HTTP handlers.

## Document processing pipeline

```text
Upload -> Local storage -> Text extraction -> Normalization -> Chunking -> Embeddings -> PostgreSQL
```

Documents are processed synchronously inside the API after their metadata and bytes are
stored. This keeps the portfolio MVP deterministic and avoids queue infrastructure while the
`DocumentProcessor` boundary can later move behind a background worker. Processing replaces all
chunks and updates document status in one transaction, so retries do not duplicate chunks or
leave partial new chunk sets.

TXT uses strict UTF-8 decoding. Markdown retains headings, lists, and fenced code. PDF extraction
uses page-aware text from `pdf-parse`; OCR is intentionally absent. Normalization preserves
paragraph and code boundaries, and chunking prefers semantic boundaries with configurable
character targets and overlap.

## Embedding generation

`DocumentProcessor` depends on an `EmbeddingProvider` abstraction through `EmbeddingService`.
The service batches ordered chunk inputs, enforces input-size limits, and validates the count,
dimension, and finite numeric values of every returned vector. The production provider uses the
official OpenAI SDK with an explicit 1536-dimension request, bounded timeout, and retries. The
deterministic mock provider supports offline local development and tests.

Only after all embeddings succeed does the repository transaction delete old chunks, insert the
complete new chunk/vector set using pgvector serialization, and mark the document ready. A
failure marks the document failed and removes stale chunks, preventing mixed or partially indexed
sets. API responses expose only `hasEmbedding`; vectors and provider credentials stay server-side.
Semantic retrieval and RAG remain outside the current architecture phase.
