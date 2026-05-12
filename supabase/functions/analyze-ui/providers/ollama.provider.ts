import type { LLMProvider, LLMMessage, LLMConfig, LLMResponse } from './types.ts';

export class OllamaProvider implements LLMProvider {
    async analyze(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
        const baseUrl = Deno.env.get('OLLAMA_BASE_URL') || 'http://localhost:11434';

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.model,
                messages,
                options: {
                    temperature: config.temperature,
                    num_predict: config.maxTokens,
                },
                stream: false,
                format: 'json',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama API error (${response.status}): ${error}`);
        }

        const data = await response.json();
        return {
            content: data.message.content,
            model: data.model,
        };
    }
}
