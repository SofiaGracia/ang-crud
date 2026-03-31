import { Component, inject, input, signal } from '@angular/core';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'prototype-card',
    imports: [FaIconComponent],
    templateUrl: './prototype-card.html',
})
export class PrototypeCard {
    proto = input.required<PrototypeInterface>();
    private prototypesFacade = inject(PrototypesFacade);
    private sanitizer = inject(DomSanitizer);

    htmlContent = signal<SafeHtml | null>(null);

    faEllipsis = faEllipsis;

    ngOnInit() {
        const url = this.proto().url;
        if (url) {
            fetch(url)
                .then((res) => res.text())
                .then((html) => {
                    this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
                });
        }
    }

    get safeUrl(): SafeResourceUrl | null {
        const url = this.proto().url;
        if (!url) return null;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    deleteProto(event: MouseEvent, id: number, projectId: number) {
        event.stopPropagation();
        this.prototypesFacade.removeProto(id, projectId);
        console.log('Prototype removed');
    }
}
