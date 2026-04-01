import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
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

    prototype = signal<PrototypeInterface | null>(null);
    srcdoc = signal<SafeHtml | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);

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
        return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body { margin: 0; padding: 0; min-height: 100%; }
      body { padding: 1rem; }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`;
    }
}
