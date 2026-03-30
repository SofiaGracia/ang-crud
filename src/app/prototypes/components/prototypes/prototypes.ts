import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { PrototypeCard } from '../prototype-card/prototype-card';
import { distinctUntilChanged, filter, map, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogPrototype } from '../dialog-prototype/dialog-prototype';

@Component({
    selector: 'app-prototypes',
    imports: [AsyncPipe, PrototypeCard, DialogPrototype],
    templateUrl: './prototypes.html',
})
export class Prototypes {
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);

    prototypesFacade = inject(PrototypesFacade);
    projectsFacade = inject(ProjectsFacade);

    project$ = this.projectsFacade.project$;
    prototypes$ = this.prototypesFacade.prototypes$;

    constructor() {
        this.route.paramMap
            .pipe(
                map((pm) => Number(pm.get('projectId'))),
                filter((id) => Number.isFinite(id) && id > 0),
                distinctUntilChanged(),
                tap((id) => {
                    this.projectsFacade.loadProject(id);
                    this.prototypesFacade.loadPrototypes(id);
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }
}
