import { Component, inject, input, signal, OnInit, OnDestroy } from '@angular/core';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
    selector: 'prototype-card',
    imports: [FaIconComponent],
    templateUrl: './prototype-card.html',
})
export class PrototypeCard implements OnInit, OnDestroy {
    proto = input.required<PrototypeInterface>();
    private prototypesFacade = inject(PrototypesFacade);
    private sanitizer = inject(DomSanitizer);
    private router = inject(Router);
    private abortController = new AbortController();

    htmlContent = signal<SafeHtml | null>(null);

    faEllipsis = faEllipsis;

    ngOnInit() {
        const url = this.proto().url;
        if (url) {
            fetch(url, { signal: this.abortController.signal })
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.text();
                })
                .then((html) => {
                    const wrappedSrcdoc = this.buildSrcdoc(html);
                    this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(wrappedSrcdoc));
                })
                .catch((err) => {
                    if (err.name === 'AbortError') return;
                    console.error('Failed to fetch prototype preview', err);
                });
        }
    }

    ngOnDestroy() {
        this.abortController.abort();
    }

    deleteProto(event: MouseEvent, id: number, projectId: number) {
        event.stopPropagation();
        this.prototypesFacade.removeProto(id, projectId);
    }

    openPreview() {
        const { id, project_id: projectId } = this.proto();
        if (!projectId) return;
        this.router.navigate(['/projects', projectId, 'prototypes', id]);
    }

    private buildSrcdoc(html: string): string {
        return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body { margin: 0; padding: 2rem; min-height: 100%; display: flex, justify-content: center, background-color: #111827; }
      body { padding: 0.75rem; }
    </style>
  </head>
  <body>
  <div class="flex items-center justify-center bg-gray-900 p-8 scheme-dark">
  ${html}
  </div>
  </body>
</html>`;
    }
}
