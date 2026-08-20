import type { MigrationBuilder } from 'node-pg-migrate';

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.sql(`
    ALTER TABLE documents
      ADD COLUMN storage_key text,
      ADD COLUMN checksum_sha256 character(64),
      ADD CONSTRAINT documents_storage_key_unique UNIQUE (storage_key),
      ADD CONSTRAINT documents_checksum_sha256_format
        CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[0-9a-f]{64}$');

    COMMENT ON COLUMN documents.storage_key IS
      'Storage-provider key; never expose this value through the public API.';
  `);
}

export function down(pgm: MigrationBuilder): void {
  pgm.sql(`
    ALTER TABLE documents
      DROP CONSTRAINT documents_checksum_sha256_format,
      DROP CONSTRAINT documents_storage_key_unique,
      DROP COLUMN checksum_sha256,
      DROP COLUMN storage_key;
  `);
}
