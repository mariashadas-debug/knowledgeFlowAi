import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface DocumentStorage {
  save(data: Buffer, extension: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export class LocalDocumentStorage implements DocumentStorage {
  constructor(private readonly directory: string) {}

  async save(data: Buffer, extension: string): Promise<string> {
    await mkdir(this.directory, { recursive: true });
    const key = `${randomUUID()}${extension}`;
    await writeFile(path.join(this.directory, key), data, { flag: 'wx' });
    return key;
  }

  async delete(key: string): Promise<void> {
    const safeKey = path.basename(key);
    if (safeKey !== key) {
      throw new Error('Invalid storage key');
    }

    try {
      await unlink(path.join(this.directory, safeKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
