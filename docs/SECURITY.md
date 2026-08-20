# Security

KnowledgeFlow AI treats uploads and retrieved content as untrusted input.

## Controls

- Uploads use server-generated storage keys, extension and MIME allowlists, strict size limits, and
  path containment. Files are stored outside PostgreSQL and are never executed.
- Extracted Markdown and PDF text is rendered as escaped text, not interpreted as HTML or commands.
- Retrieved content is labeled as data. The system instruction explicitly rejects instructions
  found inside documents and requires answers to use only supplied company knowledge.
- Similarity filtering happens before LLM generation. With no sufficiently relevant context, the
  real LLM is not called and a fixed insufficient-knowledge response is returned.
- Context and recent history are bounded to reduce unintended disclosure and denial-of-service
  risk. Current limits are character-based.
- `OPENAI_API_KEY` is server-only and never uses a `NEXT_PUBLIC_` variable.
- Embedding vectors, hidden instructions, internal prompts, storage paths, stack traces, and API
  keys are not returned to browsers.
- Logs contain document/conversation identifiers and aggregate timing, never complete private
  content, prompts, vectors, or credentials. Request-log chunk metadata contains IDs, rank, and
  similarity only.

## Prompt injection

Documents can contain text that asks the model to ignore policy, reveal secrets, or perform an
action. KnowledgeFlow separates application instructions from retrieved data, bounds context, and
does not give the model tools or credentials. These controls reduce risk but do not provide perfect
prompt-injection prevention. Production deployments should add adversarial evaluations, access
control, document-level authorization, output monitoring, and incident review.

## Deployment gaps

This portfolio application has no authentication or tenant isolation. Local filesystem storage is
not appropriate for horizontally scaled production deployment. TLS, rate limiting, malware
scanning, backups, secrets management, retention policies, and audit access controls remain host or
future deployment responsibilities.
