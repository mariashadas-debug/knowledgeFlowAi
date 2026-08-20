import type { LLMProvider, LLMRequest, LLMResponse } from './llm-provider.js';

export class MockLLMProvider implements LLMProvider {
  readonly providerName = 'mock';
  readonly model = 'deterministic-mock-llm-v1';

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const source = request.prompt.match(
      /\[S1\][^\n]*\n([\s\S]*?)(?:\n\n\[S2\]|\n\nCURRENT QUESTION:)/,
    )?.[1];
    const summary =
      source
        ?.trim()
        .split(/(?<=[.!?])\s+/)
        .slice(0, 3)
        .join(' ') ?? 'Relevant company knowledge was retrieved.';
    return {
      content: `Based on the company knowledge, ${summary} [S1]`,
      model: this.model,
      usage: { promptTokens: null, completionTokens: null, totalTokens: null },
    };
  }
}
