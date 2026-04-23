import { inject, Injectable } from '@angular/core';
import { Prototype, PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { PaginatedResponse } from '@shared/interfaces/paginated-response.interface';
import { BehaviorSubject, Observable, switchMap, filter, combineLatest, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PrototypesFacade {
    private refresh$ = new BehaviorSubject<number | null>(null);
    private page$ = new BehaviorSubject<number>(1);
    private prototypesSupabaseService = inject(PrototypesSupabaseService);
    private limit = 8;

    prototypes$ = this.refresh$.pipe(
        filter((projectId) => projectId !== null),
        switchMap((projectId) => this.prototypesSupabaseService.getPrototypesByProject(projectId!)),
    );

    paginatedPrototypes$ = combineLatest([this.refresh$, this.page$]).pipe(
        filter(([projectId]) => projectId !== null),
        switchMap(([projectId, page]) =>
            this.prototypesSupabaseService.getPrototypesPaginated(projectId!, page, this.limit),
        ),
    );

    totalPages$ = this.paginatedPrototypes$.pipe(map((r) => r.totalPages));
    currentPage$ = this.page$.asObservable();
    totalCount$ = this.paginatedPrototypes$.pipe(map((r) => r.total));

    goToPage(page: number) {
        this.page$.next(page);
    }

    nextPage() {
        this.page$.next(this.page$.value + 1);
    }

    prevPage() {
        if (this.page$.value > 1) {
            this.page$.next(this.page$.value - 1);
        }
    }

    loadPrototypes(projectId: number) {
        this.refresh$.next(projectId);
    }

    addPrototype(projectId: number, prototype: Prototype) {
        this.prototypesSupabaseService.addPrototype(prototype).subscribe({
            next: () => this.refresh$.next(projectId),
            error: (err) => console.error('Error creating prototype', err),
        });
    }

    removeProto(protoId: number, projectId: number) {
        this.prototypesSupabaseService.moveToTrash(protoId).subscribe({
            next: () => {
                this.refresh$.next(projectId);
            },
            error: (err) => {
                console.error('Error removing prototype', err);
            },
        });
    }

    getPrototypeById(projectId: number, prototypeId: number): Observable<PrototypeInterface | null> {
        return this.prototypesSupabaseService.getPrototypeById(projectId, prototypeId);
    }

    searchPrototypesByName(query: string): Observable<PrototypeInterface[] | null> {
        return this.prototypesSupabaseService.searchPrototypesByName(query);
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
