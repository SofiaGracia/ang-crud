import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { RecentPrototypesService } from '@prototypes/services/recent-prototypes.service';
import { distinctUntilChanged, filter, forkJoin, from, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { parseHtml } from '@prototypes/parser';
import type { HtmlElementNode, HtmlNode } from '@prototypes/parser/interfaces/html-node.interface';
import { serializeTreeToString } from '@prototypes/editor/services/tree-mutation.service';
import { EditorFacade } from '@prototypes/editor/facades/editor.facade';
import { AiDrawer } from '@prototypes/ai/components/ai-drawer/ai-drawer';
import { AiAnalysisFacade } from '@prototypes/ai/facades/ai-analysis.facade';
import type { ApplySuggestionEvent } from '@prototypes/ai/interfaces/ai-analysis.interface';

function wrapInRoot(nodes: HtmlNode[]): HtmlElementNode {
    return {
        type: 'element',
        tag: 'div',
        attributes: {},
        children: nodes,
    };
}

@Component({
    selector: 'app-prototype',
    imports: [AiDrawer],
    templateUrl: './prototype.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Prototype {
    private route = inject(ActivatedRoute);
    private prototypesFacade = inject(PrototypesFacade);
    private sanitizer = inject(DomSanitizer);
    private recentService = inject(RecentPrototypesService);
    private aiFacade = inject(AiAnalysisFacade);
    editorFacade = inject(EditorFacade);

    prototype = signal<PrototypeInterface | null>(null);
    originalSrcdoc = signal<SafeHtml | null>(null);
    currentSrcdoc = signal<SafeHtml | null>(null);
    downloadedHtml = signal<string | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);
    viewMode = signal<'original' | 'current'>('current');
    activeTab = signal<'preview' | 'code' | 'tree'>('preview');
    previewVersion = signal(0);

    treeJson = computed(() => {
        const tree = this.editorFacade.workingTree();
        return tree ? JSON.stringify(tree, null, 2) : '';
    });

    originalTreeJson = computed(() => {
        const tree = this.editorFacade.originalTree();
        return tree ? JSON.stringify(tree, null, 2) : '';
    });

    currentHtml = computed(() => {
        const tree = this.editorFacade.workingTree();
        return tree ? serializeTreeToString(tree) : '';
    });

    constructor() {
        this.route.paramMap
            .pipe(
                map((params) => ({
                    projectId: Number(params.get('projectId')),
                    prototypeId: Number(params.get('prototypeId')),
                })),
                filter(
                    ({ projectId, prototypeId }) =>
                        Number.isFinite(projectId) &&
                        projectId > 0 &&
                        Number.isFinite(prototypeId) &&
                        prototypeId > 0,
                ),
                distinctUntilChanged(
                    (prev, curr) =>
                        prev.projectId === curr.projectId && prev.prototypeId === curr.prototypeId,
                ),
                tap(() => {
                    this.loading.set(true);
                    this.error.set(null);
                    this.originalSrcdoc.set(null);
                    this.currentSrcdoc.set(null);
                    this.downloadedHtml.set(null);
                    this.aiFacade.resetAnalysis();
                    this.viewMode.set('current');
                    this.activeTab.set('preview');
                }),
                switchMap(({ projectId, prototypeId }) =>
                    this.prototypesFacade.getPrototypeById(projectId, prototypeId).pipe(
                        switchMap((prototype) => {
                            if (!prototype) return of(null);
                            this.prototype.set(prototype);
                            const pid = Number(this.route.snapshot.paramMap.get('projectId'));
                            if (pid && prototype.id) {
                                this.recentService.addRecentPrototype(prototype.id, pid);
                            }
                            if (!prototype.url) {
                                this.error.set('Este prototipo no tiene URL de preview.');
                                this.loading.set(false);
                                return of(null);
                            }
                            return forkJoin({
                                html: from(
                                    fetch(prototype.url).then((r) => {
                                        if (!r.ok) {
                                            throw new Error(`Failed to fetch preview: ${r.status}`);
                                        }
                                        return r.text();
                                    }),
                                ),
                                hasSavedTree: this.editorFacade.loadFromDb(prototype.id),
                            });
                        }),
                    ),
                ),
                takeUntilDestroyed(),
            )
            .subscribe({
                next: (result) => {
                    if (!result) return;

                    const { html, hasSavedTree } = result;
                    this.downloadedHtml.set(html);

                    const parsed = parseHtml(html);
                    const nodes = parsed.filter(
                        (n) => n.type === 'element' || (n.type === 'text' && n.content.trim().length > 0),
                    );
                    const root = nodes.length === 1 && nodes[0].type === 'element'
                        ? nodes[0] as HtmlElementNode
                        : wrapInRoot(nodes);
                    this.editorFacade.setOriginalTree(root);

                    if (!hasSavedTree) {
                        this.editorFacade.syncWorkingToOriginal();
                    }

                    this.buildOriginalPreview();
                    this.updatePreviewFromTree();
                    this.loading.set(false);
                },
                error: (err) => {
                    console.error('Error loading prototype', err);
                    this.error.set('No se pudo cargar el prototipo.');
                    this.loading.set(false);
                },
            });
    }

    private buildOriginalPreview(): void {
        const html = this.downloadedHtml();
        if (!html) return;
        const wrapped = this.buildSrcdoc(html);
        this.originalSrcdoc.set(this.sanitizer.bypassSecurityTrustHtml(wrapped));
    }

    switchMode(mode: 'original' | 'current'): void {
        this.viewMode.set(mode);
        this.previewVersion.update((v) => v + 1);
    }

    analyzeUi(): void {
        const tree = this.editorFacade.workingTree();
        if (!tree) return;
        this.aiFacade.openDrawer(tree);
    }

    handleApplySuggestion(event: ApplySuggestionEvent): void {
        const actions = event.suggestion.actions;
        if (!actions || actions.length === 0) {
            console.warn('Suggestion has no actions:', event.suggestion.id);
            return;
        }

        for (const action of actions) {
            this.editorFacade.dispatch(action);
        }

        this.updatePreviewFromTree();
    }

    private updatePreviewFromTree(): void {
        const tree = this.editorFacade.workingTree();
        if (!tree) return;

        this.previewVersion.update((v) => v + 1);

        const innerHtml = tree.children
            .map((child) =>
                child.type === 'element' ? serializeTreeToString(child) : child.content,
            )
            .join('');

        const wrappedSrcdoc = this.buildSrcdoc(innerHtml);
        this.currentSrcdoc.set(this.sanitizer.bypassSecurityTrustHtml(wrappedSrcdoc));
    }

    resetTree(): void {
        this.editorFacade.reset();
        this.updatePreviewFromTree();
    }

    private buildSrcdoc(html: string): string {
        const parser = new DOMParser();

        const parsedDoc = parser.parseFromString(html, 'text/html');

        const shell = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const anchor = target.closest('a[href]');
        if (!anchor) return;

        event.preventDefault();
      }, true);
    </script>
    <style>
      body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background-color: oklch(21% 0.034 264.665); }
    </style>
  </head>
  <body>
    <div id="preview-root" class="flex items-center justify-center bg-gray-900 p-8 scheme-dark"></div>
  </body>
</html>`;

        const destDoc = parser.parseFromString(shell, 'text/html');
        const destHead = destDoc.head;
        const destRoot = destDoc.getElementById('preview-root');
        const srcHead = parsedDoc.head;
        const srcBody = parsedDoc.body;

        if (!destHead || !destRoot) {
            return shell;
        }
        if (!srcHead || !srcBody) {
            destRoot.innerHTML = html;
            return `<!doctype html>\n${destDoc.documentElement.outerHTML}`;
        }

        for (const node of Array.from(srcHead.childNodes)) {
            destHead.appendChild(node.cloneNode(true));
        }

        while (destRoot.firstChild) destRoot.removeChild(destRoot.firstChild);
        for (const node of Array.from(srcBody.childNodes)) {
            destRoot.appendChild(node.cloneNode(true));
        }

        return `<!doctype html>\n${destDoc.documentElement.outerHTML}`;
    }
}
