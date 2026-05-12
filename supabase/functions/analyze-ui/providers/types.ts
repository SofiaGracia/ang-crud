export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMConfig {
    model: string;
    temperature: number;
    maxTokens: number;
}

export interface LLMResponse {
    content: string;
    model: string;
}

export interface LLMProvider {
    analyze(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse>;
}
