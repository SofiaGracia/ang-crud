import { inject, Injectable } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    AiAnalysisIssue,
    AiAnalysisResponse,
    AiAnalysisSuggestion,
} from '../interfaces/ai-analysis.interface';

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {
    analyze(tree: unknown): Observable<AiAnalysisResponse> {
        if (!tree) {
            return throwError(() => new Error('No UI structure to analyze'));
        }

        const delay = 800 + Math.random() * 400;

        return timer(delay).pipe(map(() => this.buildMockResponse()));
    }

    private buildMockResponse(): AiAnalysisResponse {
        const issues: AiAnalysisIssue[] = [
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
        ];

        const suggestions: AiAnalysisSuggestion[] = [
            {
                id: 'sug-1',
                type: 'accessibility',
                title: 'Add ARIA Labels to Interactive Elements',
                description:
                    'Add aria-label attributes to buttons, links, and form controls to improve screen reader navigation and meet WCAG 2.1 AA standards.',
            },
            {
                id: 'sug-2',
                type: 'semantic',
                title: 'Use Semantic HTML Elements',
                description:
                    'Replace generic <div> containers with semantic elements like <nav>, <main>, <section>, and <article> for better SEO and accessibility.',
            },
            {
                id: 'sug-3',
                type: 'structure',
                title: 'Implement Responsive Meta Tags',
                description:
                    'Add the viewport meta tag and responsive breakpoints to ensure the UI renders correctly across all device sizes.',
            },
        ];

        return {
            summary:
                'The analysis reviewed the UI component tree across 47 nodes. 3 potential issues were identified, primarily related to accessibility, color contrast, and responsive design. The overall structure follows a clean component-based architecture, with opportunities for semantic HTML improvements.',
            issues,
            suggestions,
        };
    }
}
