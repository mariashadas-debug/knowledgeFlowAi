# Architecture

## Database

The API uses a single `pg` connection pool created during startup and closed during graceful
shutdown. Schema changes are explicit `node-pg-migrate` migrations rather than application
startup side effects.

The initial `document_chunks.embedding` column is `vector(1536)`. No ANN index is created yet:
exact search is appropriate for the initial empty/small dataset, and the eventual index should
be chosen using measured corpus size and query behavior.
