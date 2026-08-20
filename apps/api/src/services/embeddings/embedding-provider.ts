export interface EmbeddingProvider {
  readonly providerName: string;
  readonly model: string;
  readonly dimension: number;

  createEmbedding(text: string): Promise<number[]>;
  createEmbeddings(texts: string[]): Promise<number[][]>;
  acceptsRetrievalCandidate?(query: string, candidate: string): boolean;
}
