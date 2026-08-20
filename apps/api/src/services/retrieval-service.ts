import type { RetrievalRepository, RetrievedChunk } from '../repositories/retrieval-repository.js';
import type { EmbeddingService } from './embeddings/embedding-service.js';

export class RetrievalService {
  constructor(
    private readonly embeddings: EmbeddingService,
    private readonly repository: RetrievalRepository,
    private readonly topK: number,
    private readonly minimumSimilarity: number,
  ) {}

  async retrieve(question: string): Promise<RetrievedChunk[]> {
    const [embedding] = await this.embeddings.createEmbeddings([question]);
    if (!embedding) throw new Error('Question embedding was not generated');
    const providerGuard = this.embeddings.provider.acceptsRetrievalCandidate;
    const candidates = await this.repository.search(
      embedding,
      providerGuard ? this.topK * 3 : this.topK,
      this.minimumSimilarity,
    );
    if (!providerGuard) return candidates;
    return candidates
      .filter((candidate) =>
        providerGuard.call(this.embeddings.provider, question, candidate.content),
      )
      .slice(0, this.topK);
  }
}
