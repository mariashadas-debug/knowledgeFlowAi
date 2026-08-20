import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});

import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().max(100).default(10),
    STORAGE_DIRECTORY: z.string().min(1).default('storage/documents'),
    CHUNK_SIZE: z.coerce.number().int().min(200).max(10_000).default(1200),
    CHUNK_OVERLAP: z.coerce.number().int().min(0).max(2_000).default(200),
    AI_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
    OPENAI_API_KEY: z.string().optional(),
    EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
    EMBEDDING_BATCH_SIZE: z.coerce.number().int().min(1).max(128).default(32),
    EMBEDDING_MAX_INPUT_CHARACTERS: z.coerce.number().int().min(1_000).max(100_000).default(12_000),
    OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(30_000),
    EMBEDDING_DIMENSION: z.coerce.number().pipe(z.literal(1536)).default(1536),
    LLM_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
    LLM_MODEL: z.string().min(1).default('gpt-4.1-mini'),
    RAG_TOP_K: z.coerce.number().int().min(1).max(20).default(5),
    RAG_MIN_SIMILARITY: z.coerce.number().min(-1).max(1).default(0.15),
    RAG_MAX_CONTEXT_CHARACTERS: z.coerce.number().int().min(1_000).max(100_000).default(12_000),
    RAG_MAX_HISTORY_MESSAGES: z.coerce.number().int().min(0).max(50).default(10),
    LLM_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(64).max(4_096).default(800),
  })
  .refine((environment) => environment.CHUNK_OVERLAP < environment.CHUNK_SIZE, {
    message: 'CHUNK_OVERLAP must be smaller than CHUNK_SIZE',
    path: ['CHUNK_OVERLAP'],
  })
  .refine(
    (environment) => environment.AI_PROVIDER !== 'openai' || Boolean(environment.OPENAI_API_KEY),
    { message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai', path: ['OPENAI_API_KEY'] },
  )
  .refine(
    (environment) => environment.LLM_PROVIDER !== 'openai' || Boolean(environment.OPENAI_API_KEY),
    { message: 'OPENAI_API_KEY is required when LLM_PROVIDER=openai', path: ['OPENAI_API_KEY'] },
  );

export type EnvironmentConfig = z.infer<typeof environmentSchema>;

export function loadEnvironment(environment: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return result.data;
}

export function resolveStorageDirectory(storageDirectory: string): string {
  const apiDirectory = fileURLToPath(new URL('../..', import.meta.url));
  const repositoryDirectory = path.resolve(apiDirectory, '../..');

  return path.resolve(repositoryDirectory, storageDirectory);
}
