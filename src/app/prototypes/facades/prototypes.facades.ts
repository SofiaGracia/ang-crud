import { inject, Injectable } from '@angular/core';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { BehaviorSubject, switchMap, filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PrototypesFacade {
    private refresh$ = new BehaviorSubject<number | null>(null);
    private prototypesSupabaseService = inject(PrototypesSupabaseService);

    prototypes$ = this.refresh$.pipe(
        filter((projectId) => projectId !== null),
        switchMap((projectId) => this.prototypesSupabaseService.getPrototypesByProject(projectId!)),
    );

    loadPrototypes(projectId: number) {
        this.refresh$.next(projectId);
    }

    // addPrototype(projectId: number, prototype: Prototype) {
    //     this.prototypesSupabaseService.addPrototype(prototype).subscribe({
    //         next: () => this.refresh$.next(projectId),
    //         error: (err) => console.error('Error creating prototype', err),
    //     });
    // }

    removeProto(protoId: number, projectId: number) {
        this.prototypesSupabaseService.removeProto(protoId).subscribe({
            next: () => {
                this.refresh$.next(projectId);
            },
            error: (err) => {
                console.error('Error removing prototype', err);
            },
        });
    }

    // updateProject(projectId: number, dataToUpdate: Project) {
    //     this.projectSupabaseService.updateProject(projectId, dataToUpdate).subscribe({
    //         next: () => {
    //             this.refresh$.next();
    //         },
    //         error: (err) => {
    //             console.error('Error updating project', err);
    //         },
    //     });
    // }
}
