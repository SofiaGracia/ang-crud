import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { OpenAIProvider } from './providers/openai.provider.ts';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder.ts';
import { resolveActions, type RawLLMResponse } from './action-resolver.ts';
import type { LLMProvider } from './providers/types.ts';

const RATE_LIMIT_WINDOW_MS = 10_000;
const requestLog = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const timestamps = requestLog.get(ip) || [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= 1) return false;

    recent.push(now);
    requestLog.set(ip, recent);
    return true;
}

function getMockResponse() {
    return {
        summary:
            'The analysis reviewed the UI component tree. 3 potential issues were identified, primarily related to accessibility, color contrast, and responsive design. The overall structure follows a clean component-based architecture, with opportunities for semantic HTML improvements.',
        issues: [
            {
                severity: 'high',
                message:
                    'Missing ARIA labels on interactive elements such as buttons and links.',
            },
            {
                severity: 'medium',
                message: 'Insufficient color contrast detected in text-overlay areas.',
            },
            {
                severity: 'low',
                message:
                    'No responsive viewport configuration found for mobile devices.',
            },
        ],
        suggestions: [
            {
                id: 'sug-1',
                type: 'accessibility',
                title: 'Add ARIA Labels to Interactive Elements',
                description:
                    'Add aria-label attributes to buttons, links, and form controls to improve screen reader navigation and meet WCAG 2.1 AA standards.',
                actions: [
                    {
                        type: 'add-class',
                        targetNodePath: '/children/0',
                        payload: { className: 'aria-labeled' },
                    },
                ],
            },
            {
                id: 'sug-2',
                type: 'semantic',
                title: 'Use Semantic HTML Elements',
                description:
                    'Replace generic <div> containers with semantic elements like <nav>, <main>, <section>, and <article> for better SEO and accessibility.',
                actions: [
                    {
                        type: 'replace-tag',
                        targetNodePath: '/children/0',
                        payload: { newTag: 'nav' },
                    },
                    {
                        type: 'replace-tag',
                        targetNodePath: '/children/0/children/0',
                        payload: { newTag: 'button' },
                    },
                ],
            },
            {
                id: 'sug-3',
                type: 'structure',
                title: 'Implement Responsive Meta Tags',
                description:
                    'Add the viewport meta tag and responsive breakpoints to ensure the UI renders correctly across all device sizes.',
                actions: [
                    {
                        type: 'add-class',
                        targetNodePath: '/',
                        payload: { className: 'responsive' },
                    },
                ],
            },
        ],
    };
}

serve(async (req) => {
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { headers: corsHeaders, status: 405 },
        );
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
        return new Response(
            JSON.stringify({
                error: 'Rate limit exceeded. Please wait 10 seconds between requests.',
            }),
            { headers: corsHeaders, status: 429 },
        );
    }

    try {
        const body = await req.json();
        const { annotatedTree, idToPath } = body;

        if (!annotatedTree || typeof annotatedTree !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Missing required field: annotatedTree (string)' }),
                { headers: corsHeaders, status: 400 },
            );
        }

        const aiEnabled = Deno.env.get('AI_ENABLED') === 'true';

        if (!aiEnabled) {
            return new Response(JSON.stringify(getMockResponse()), {
                headers: corsHeaders,
            });
        }

        const provider: LLMProvider = new OpenAIProvider();
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(annotatedTree);

        const llmResponse = await provider.analyze(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { model: 'gpt-4o-mini', temperature: 0.1, maxTokens: 2000 },
        );

        const raw: RawLLMResponse = JSON.parse(llmResponse.content);

        if (!raw.suggestions || !Array.isArray(raw.suggestions)) {
            throw new Error('Invalid LLM response: missing suggestions array');
        }

        const resolved = resolveActions(raw, idToPath || {});

        return new Response(JSON.stringify(resolved), { headers: corsHeaders });
    } catch (error) {
        console.error('analyze-ui error:', error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Internal server error',
            }),
            { headers: corsHeaders, status: 500 },
        );
    }
});
