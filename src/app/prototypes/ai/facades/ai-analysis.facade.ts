import { computed, inject, Injectable, signal } from '@angular/core';
import { AiAnalysisResponse } from '../interfaces/ai-analysis.interface';
import { AiAnalysisService } from '../services/ai-analysis.service';

interface AiAnalysisState {
    isDrawerOpen: boolean;
    isLoading: boolean;
    analysis: AiAnalysisResponse | null;
    error: string | null;
    appliedSuggestionIds: Set<string>;
    lastTree: unknown | null;
}

const initialState: AiAnalysisState = {
    isDrawerOpen: false,
    isLoading: false,
    analysis: null,
    error: null,
    appliedSuggestionIds: new Set(),
    lastTree: null,
};

@Injectable({ providedIn: 'root' })
export class AiAnalysisFacade {
    private service = inject(AiAnalysisService);
    private state = signal<AiAnalysisState>(initialState);

    readonly isDrawerOpen = computed(() => this.state().isDrawerOpen);
    readonly isLoading = computed(() => this.state().isLoading);
    readonly analysis = computed(() => this.state().analysis);
    readonly error = computed(() => this.state().error);
    readonly appliedSuggestionIds = computed(() => this.state().appliedSuggestionIds);

    openDrawer(tree: unknown): void {
        const current = this.state();

        this.state.update((s) => ({ ...s, lastTree: tree }));

        if (current.analysis || current.isLoading) {
            this.state.update((s) => ({ ...s, isDrawerOpen: true }));
            return;
        }

        this.state.update((s) => ({ ...s, isDrawerOpen: true, isLoading: true, error: null }));

        this.service.analyze(tree).subscribe({
            next: (result) => {
                this.state.update((s) => ({ ...s, isLoading: false, analysis: result }));
            },
            error: (err) => {
                console.error('AI Analysis error', err);
                this.state.update((s) => ({
                    ...s,
                    isLoading: false,
                    error: 'Analysis failed. Please try again.',
                }));
            },
        });
    }

    closeDrawer(): void {
        this.state.update((s) => ({ ...s, isDrawerOpen: false }));
    }

    applySuggestion(id: string): void {
        this.state.update((s) => {
            const next = new Set(s.appliedSuggestionIds);
            next.add(id);
            return { ...s, appliedSuggestionIds: next };
        });
    }

    resetAnalysis(): void {
        this.state.set({ ...initialState });
    }

    retryAnalysis(): void {
        const tree = this.state().lastTree;
        if (!tree) return;

        this.state.update((s) => ({
            ...s,
            isLoading: true,
            error: null,
            analysis: null,
        }));

        this.service.analyze(tree).subscribe({
            next: (result) => {
                this.state.update((s) => ({ ...s, isLoading: false, analysis: result }));
            },
            error: (err) => {
                console.error('AI Analysis error', err);
                this.state.update((s) => ({
                    ...s,
                    isLoading: false,
                    error: 'Analysis failed. Please try again.',
                }));
            },
        });
    }
}
