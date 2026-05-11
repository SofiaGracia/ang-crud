import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';
import type { TreeAction } from '@prototypes/editor/interfaces/tree-action.interface';
import { TreeMutationService } from '@prototypes/editor/services/tree-mutation.service';
import { EditorSupabaseService } from '@prototypes/editor/services/editor-supabase.service';
import { AuthFacade } from '@auth/facades/auth.facade';

function treeHash(tree: HtmlElementNode): string {
    return JSON.stringify(tree);
}

@Injectable({ providedIn: 'root' })
export class EditorFacade {
    private readonly mutationService = new TreeMutationService();
    private readonly supabaseService = inject(EditorSupabaseService);
    private readonly authFacade = inject(AuthFacade);
    private readonly destroyRef = inject(DestroyRef);

    readonly originalTree = signal<HtmlElementNode | null>(null);
    readonly workingTree = signal<HtmlElementNode | null>(null);
    readonly isSaving = signal(false);
    readonly lastSavedAt = signal<string | null>(null);

    private prototypeId: number | null = null;
    private lastSavedHash: string | null = null;
    private autoSave$ = new Subject<HtmlElementNode>();

    constructor() {
        this.autoSave$
            .pipe(
                debounceTime(2000),
                filter(() => this.prototypeId !== null && this.authFacade.currentUserId !== null),
                distinctUntilChanged((a, b) => treeHash(a) === treeHash(b)),
                tap(() => this.isSaving.set(true)),
                switchMap((tree) =>
                    this.supabaseService.upsertTree(
                        this.prototypeId!,
                        this.authFacade.currentUserId!,
                        tree,
                    ),
                ),
                tap({
                    next: () => {
                        this.isSaving.set(false);
                        this.lastSavedAt.set(new Date().toISOString());
                        const tree = this.workingTree();
                        if (tree) this.lastSavedHash = treeHash(tree);
                    },
                    error: () => this.isSaving.set(false),
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    loadTree(tree: HtmlElementNode): void {
        this.originalTree.set(structuredClone(tree));
        this.workingTree.set(structuredClone(tree));
        this.lastSavedHash = treeHash(tree);
    }

    loadFromDb(prototypeId: number): Observable<boolean> {
        this.prototypeId = prototypeId;
        return this.supabaseService.getTree(prototypeId).pipe(
            map((saved) => {
                if (saved) {
                    this.loadTree(saved.tree as HtmlElementNode);
                    return true;
                }
                return false;
            }),
        );
    }

    dispatch(action: TreeAction): boolean {
        const current = this.workingTree();
        if (!current) return false;

        const { tree, mutated } = this.mutationService.applyAction(current, action);
        if (mutated) {
            this.workingTree.set(tree);
            this.triggerAutoSave(tree);
        }
        return mutated;
    }

    reset(): void {
        const original = this.originalTree();
        if (original) {
            this.workingTree.set(structuredClone(original));
            this.triggerAutoSave(original);
        }
    }

    saveNow(): void {
        const tree = this.workingTree();
        if (!tree || !this.prototypeId || !this.authFacade.currentUserId) return;
        if (this.lastSavedHash === treeHash(tree)) return;

        this.isSaving.set(true);
        this.supabaseService
            .upsertTree(this.prototypeId, this.authFacade.currentUserId, tree)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isSaving.set(false);
                    this.lastSavedAt.set(new Date().toISOString());
                    this.lastSavedHash = treeHash(tree);
                },
                error: () => this.isSaving.set(false),
            });
    }

    deleteSavedTree(): Observable<void> {
        if (!this.prototypeId) {
            return new Observable((observer) => {
                observer.next();
                observer.complete();
            });
        }
        return this.supabaseService.deleteTree(this.prototypeId);
    }

    private triggerAutoSave(tree: HtmlElementNode): void {
        this.autoSave$.next(tree);
    }
}
