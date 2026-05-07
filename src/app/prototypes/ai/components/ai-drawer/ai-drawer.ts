import { Component, inject, output } from '@angular/core';
import { AiAnalysisFacade } from '@prototypes/ai/facades/ai-analysis.facade';
import {
    AiAnalysisSuggestion,
    ApplySuggestionEvent,
} from '@prototypes/ai/interfaces/ai-analysis.interface';

@Component({
    selector: 'ai-drawer',
    templateUrl: './ai-drawer.html',
})
export class AiDrawer {
    private facade = inject(AiAnalysisFacade);

    readonly isOpen = this.facade.isDrawerOpen;
    readonly isLoading = this.facade.isLoading;
    readonly analysis = this.facade.analysis;
    readonly error = this.facade.error;
    readonly appliedSuggestionIds = this.facade.appliedSuggestionIds;

    readonly applySuggestion = output<ApplySuggestionEvent>();

    close(): void {
        this.facade.closeDrawer();
    }

    onApply(suggestion: AiAnalysisSuggestion): void {
        this.facade.applySuggestion(suggestion.id);
        this.applySuggestion.emit({ suggestion });
    }

    onRetry(): void {
        this.facade.retryAnalysis();
    }

    severityBadge(severity: string): string {
        switch (severity) {
            case 'high':
                return 'badge-error';
            case 'medium':
                return 'badge-warning';
            case 'low':
                return 'badge-info';
            default:
                return 'badge-ghost';
        }
    }
}
