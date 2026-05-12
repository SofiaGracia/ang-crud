import type { LLMProvider, LLMMessage, LLMConfig, LLMResponse } from './types.ts';

export class OpenAIProvider implements LLMProvider {
    async analyze(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
        const apiKey = Deno.env.get('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                temperature: config.temperature,
                max_tokens: config.maxTokens,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            model: data.model,
        };
    }
}
