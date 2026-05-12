import type { TreeAction } from '@prototypes/editor/interfaces/tree-action.interface';

export type SuggestionType = 'accessibility' | 'semantic' | 'styling' | 'structure';

export interface AiAnalysisIssue {
    severity: 'low' | 'medium' | 'high';
    message: string;
}

export interface AiAnalysisSuggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    actions?: TreeAction[];
}

export interface AiAnalysisResponse {
    summary: string;
    issues: AiAnalysisIssue[];
    suggestions: AiAnalysisSuggestion[];
}

export interface ApplySuggestionEvent {
    suggestion: AiAnalysisSuggestion;
}
