import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { map } from 'rxjs';

@Component({
    selector: 'app-prototypes',
    imports: [AsyncPipe],
    templateUrl: './prototypes.html',
})
export class Prototypes {
    private route = inject(ActivatedRoute);
    prototypesFacade = inject(PrototypesFacade);

    constructor() {
        this.route.paramMap
            .pipe(map((params) => Number(params.get('projectId'))))
            .subscribe((projectId) => {
                this.prototypesFacade.loadPrototypes(projectId);
            });
    }
}
