import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { RecentPrototypesService } from '@prototypes/services/recent-prototypes.service';
import { distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { parseHtml } from '@prototypes/parser';
import { HtmlElementNode } from '@prototypes/parser/interfaces/html-node.interface';
import { serializeTreeToString } from '@prototypes/editor/services/tree-mutation.service';
import { EditorFacade } from '@prototypes/editor/facades/editor.facade';
import { AiDrawer } from '@prototypes/ai/components/ai-drawer/ai-drawer';
import { AiAnalysisFacade } from '@prototypes/ai/facades/ai-analysis.facade';
import { ApplySuggestionEvent } from '@prototypes/ai/interfaces/ai-analysis.interface';

function wrapInRoot(nodes: HtmlElementNode[]): HtmlElementNode {
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
    srcdoc = signal<SafeHtml | null>(null);
    downloadedHtml = signal<string | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);
    activeTab = signal<'preview' | 'code' | 'tree'>('preview');
    previewVersion = signal(0);

    treeJson = computed(() => {
        const tree = this.editorFacade.workingTree();
        return tree ? JSON.stringify(tree, null, 2) : '';
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
                    this.srcdoc.set(null);
                    this.downloadedHtml.set(null);
                    this.aiFacade.resetAnalysis();
                    this.activeTab.set('preview');
                }),
                switchMap(({ projectId, prototypeId }) =>
                    this.prototypesFacade.getPrototypeById(projectId, prototypeId),
                ),
                takeUntilDestroyed(),
            )
            .subscribe({
                next: (prototype) => {
                    this.prototype.set(prototype);
                    if (!prototype) {
                        this.error.set('No se encontro el prototipo.');
                        this.loading.set(false);
                        return;
                    }
                    const projectId = Number(this.route.snapshot.paramMap.get('projectId'));
                    const prototypeId = prototype.id;
                    if (projectId && prototypeId) {
                        this.recentService.addRecentPrototype(prototypeId, projectId);
                    }
                    this.loadPreview(prototype.url ?? null);
                },
                error: (err) => {
                    console.error('Error loading prototype', err);
                    this.error.set('No se pudo cargar el prototipo.');
                    this.loading.set(false);
                },
            });
    }

    private loadPreview(url: string | null) {
        if (!url) {
            this.error.set('Este prototipo no tiene URL de preview.');
            this.loading.set(false);
            return;
        }

        fetch(url)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch preview: ${res.status}`);
                }
                return res.text();
            })
            .then((html) => {
                this.downloadedHtml.set(html);
                this.initEditorTree(html);
                const wrappedSrcdoc = this.buildSrcdoc(html);
                this.srcdoc.set(this.sanitizer.bypassSecurityTrustHtml(wrappedSrcdoc));
                this.loading.set(false);
            })
            .catch((err) => {
                console.error('Error loading preview html', err);
                this.error.set('No se pudo renderizar la preview HTML.');
                this.loading.set(false);
            });
    }

    private initEditorTree(html: string): void {
        const parsed = parseHtml(html);
        const elementNodes = parsed.filter(
            (n): n is HtmlElementNode => n.type === 'element',
        );
        const root = wrapInRoot(elementNodes);

        this.editorFacade.loadTree(root);

        console.group('🔄 Tree Loaded');
        console.log('▶ originalTree:', JSON.stringify(this.editorFacade.originalTree(), null, 2));
        console.log('▶ workingTree:', JSON.stringify(this.editorFacade.workingTree(), null, 2));
        console.log('▶ Same reference:', JSON.stringify(this.editorFacade.originalTree(), null, 2) === JSON.stringify(this.editorFacade.workingTree(), null, 2));
        console.groupEnd();
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

        console.group(`🔧 Applying suggestion: ${event.suggestion.id} (${event.suggestion.type})`);

        for (const action of actions) {
            console.group(`  Action: ${action.type} @ ${action.targetNodePath}`);
            console.log('  ▶ Before (workingTree):', JSON.stringify(this.editorFacade.workingTree(), null, 2));
            console.log('  ▶ Before (originalTree):', JSON.stringify(this.editorFacade.originalTree(), null, 2));

            const mutated = this.editorFacade.dispatch(action);

            console.log('  ▶ Mutated:', mutated);
            console.log('  ▶ After (workingTree):', JSON.stringify(this.editorFacade.workingTree(), null, 2));
            if (mutated) {
                const origStr = JSON.stringify(this.editorFacade.originalTree());
                const workStr = JSON.stringify(this.editorFacade.workingTree());
                console.log('  ▶ Differs from original:', origStr !== workStr);
            }
            console.groupEnd();
        }

        console.groupEnd();

        this.updatePreviewFromTree();
    }

    private updatePreviewFromTree(): void {
        const tree = this.editorFacade.workingTree();
        if (!tree) return;

        this.previewVersion.update((v) => v + 1);

        const innerHtml = tree.children
            .map((child) => (child.type === 'element' ? serializeTreeToString(child) : child.content))
            .join('');

        const wrappedSrcdoc = this.buildSrcdoc(innerHtml);
        this.srcdoc.set(this.sanitizer.bypassSecurityTrustHtml(wrappedSrcdoc));

        console.group('🖼 Preview Updated');
        console.log('▶ Inner HTML:', innerHtml);
        console.groupEnd();
    }

    resetTree(): void {
        this.editorFacade.reset();

        console.group('🔄 Tree Reset');
        console.log('▶ originalTree:', JSON.stringify(this.editorFacade.originalTree(), null, 2));
        console.log('▶ workingTree (after reset):', JSON.stringify(this.editorFacade.workingTree(), null, 2));
        const origStr = JSON.stringify(this.editorFacade.originalTree());
        const workStr = JSON.stringify(this.editorFacade.workingTree());
        console.log('▶ Deep equal:', origStr === workStr);
        console.groupEnd();

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
