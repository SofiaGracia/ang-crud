export interface RawAction {
    targetId: string;
    type: 'replace-tag' | 'add-class' | 'remove-node';
    payload: Record<string, unknown>;
}

export interface RawSuggestion {
    id: string;
    type: 'accessibility' | 'semantic' | 'styling' | 'structure';
    title: string;
    description: string;
    actions: RawAction[];
}

export interface RawLLMResponse {
    summary: string;
    issues: Array<{ severity: 'low' | 'medium' | 'high'; message: string }>;
    suggestions: RawSuggestion[];
}

export interface ResolvedAction {
    type: 'replace-tag' | 'add-class' | 'remove-node';
    targetNodePath: string;
    payload: Record<string, unknown>;
}

export interface ResolvedSuggestion {
    id: string;
    type: 'accessibility' | 'semantic' | 'styling' | 'structure';
    title: string;
    description: string;
    actions: ResolvedAction[];
}

export interface ResolvedResponse {
    summary: string;
    issues: Array<{ severity: 'low' | 'medium' | 'high'; message: string }>;
    suggestions: ResolvedSuggestion[];
}

export function resolveActions(
    raw: RawLLMResponse,
    idToPath: Record<string, string>,
): ResolvedResponse {
    const resolvedSuggestions: ResolvedSuggestion[] = raw.suggestions.map((suggestion) => {
        const resolvedActions: ResolvedAction[] = suggestion.actions
            .filter((action) => {
                const path = idToPath[action.targetId];
                if (!path) {
                    console.warn(`Unknown targetId "${action.targetId}" — skipping action`);
                    return false;
                }
                return true;
            })
            .map((action) => {
                const path = idToPath[action.targetId]!;
                return {
                    type: action.type,
                    targetNodePath: path,
                    payload: action.payload,
                };
            });

        return {
            id: suggestion.id,
            type: suggestion.type,
            title: suggestion.title,
            description: suggestion.description,
            actions: resolvedActions,
        };
    });

    return {
        summary: raw.summary,
        issues: raw.issues,
        suggestions: resolvedSuggestions,
    };
}
