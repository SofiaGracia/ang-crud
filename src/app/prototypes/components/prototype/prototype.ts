import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { RecentPrototypesService } from '@prototypes/services/recent-prototypes.service';
import { distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';

@Component({
    selector: 'app-prototype',
    imports: [RouterLink],
    templateUrl: './prototype.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Prototype {
    private route = inject(ActivatedRoute);
    private prototypesFacade = inject(PrototypesFacade);
    private sanitizer = inject(DomSanitizer);
    private recentService = inject(RecentPrototypesService);

    prototype = signal<PrototypeInterface | null>(null);
    srcdoc = signal<SafeHtml | null>(null);
    downloadedHtml = signal<string | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);
    activeTab = signal<'preview' | 'code'>('preview');

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
                const wrappedSrcdoc = this.buildSrcdoc(html);
                this.downloadedHtml.set(html);
                this.srcdoc.set(this.sanitizer.bypassSecurityTrustHtml(wrappedSrcdoc));
                this.loading.set(false);
            })
            .catch((err) => {
                console.error('Error loading preview html', err);
                this.error.set('No se pudo renderizar la preview HTML.');
                this.loading.set(false);
            });
    }

    private buildSrcdoc(html: string): string {
        const parser = new DOMParser();

        // Parseamos el documento del prototipo para evitar anidar un `<!doctype html><html><body>...` dentro del preview.
        const parsedDoc = parser.parseFromString(html, 'text/html');

        // Shell del preview (mantiene Tailwind + el handler que evita navegación por `<a>`).
        const shell = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      // Evita que el preview navegue cuando el HTML del prototipo contiene enlaces.
      // Mantenemos el resto de la interacción (hover, toggles, etc.).
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

        // Fallback: si el parseo del prototipo no produce head/body razonables,
        // lo tratamos como contenido "innerHTML" del contenedor.
        if (!destHead || !destRoot) {
            // Shell del preview no debería fallar; si falla, devolvemos el HTML sin transformar.
            return shell;
        }
        if (!srcHead || !srcBody) {
            destRoot.innerHTML = html;
            return `<!doctype html>\n${destDoc.documentElement.outerHTML}`;
        }

        // Fusionar <head>: clonamos los hijos del head del prototipo.
        // Nota: si el prototipo incluye `<base href>`, podría afectar a rutas relativas; es el mismo comportamiento
        // que tendría en un documento normal, pero aquí lo preservamos porque se pidió tratar el head completo.
        for (const node of Array.from(srcHead.childNodes)) {
            destHead.appendChild(node.cloneNode(true));
        }

        // Insertar solo el contenido del <body> del prototipo en el contenedor del preview.
        while (destRoot.firstChild) destRoot.removeChild(destRoot.firstChild);
        for (const node of Array.from(srcBody.childNodes)) {
            destRoot.appendChild(node.cloneNode(true));
        }

        // Serializamos el documento final para `srcdoc`.
        return `<!doctype html>\n${destDoc.documentElement.outerHTML}`;
    }
}
