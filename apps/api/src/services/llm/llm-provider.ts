export interface LLMUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export interface LLMRequest {
  systemInstruction: string;
  prompt: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: LLMUsage;
}

export interface LLMProvider {
  readonly providerName: string;
  readonly model: string;
  generate(request: LLMRequest): Promise<LLMResponse>;
}
