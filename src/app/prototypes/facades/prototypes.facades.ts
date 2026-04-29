import { inject, Injectable } from '@angular/core';
import { Prototype, PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { PaginatedResponse } from '@shared/interfaces/paginated-response.interface';
import { AuthFacade } from '@auth/facades/auth.facade';
import { BehaviorSubject, Observable, switchMap, filter, combineLatest, map, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PrototypesFacade {
    private refresh$ = new BehaviorSubject<number | null>(null);
    private page$ = new BehaviorSubject<number>(1);
    private prototypesSupabaseService = inject(PrototypesSupabaseService);
    private authFacade = inject(AuthFacade);
    private limit = 8;

    private prototypesCache = new Map<string, PaginatedResponse<PrototypeInterface>>();

    get userId(): string | null {
        return this.authFacade.currentUserId;
    }

    paginatedPrototypes$ = combineLatest([this.refresh$, this.page$]).pipe(
        filter(([projectId]) => projectId !== null),
        switchMap(([projectId, page]) => {
            const key = `prototypes-${projectId}-${this.limit}-${page}`; //prototypes-0-7
            if (this.prototypesCache.has(key)) {
                console.log('PROTOTYPES - DATA RESTORED FROM MAP');
                return of(this.prototypesCache.get(key)!);
            }

            const userId = this.userId;
            if (!userId) {
                return of(null);
            }

            return this.prototypesSupabaseService
                .getPrototypesPaginated(projectId!, userId, page, this.limit)
                .pipe(
                    tap((response) => {
                        console.log('PROTOTYPES - DATA STORED IN MAP: ', key, response);

                        if (response) {
                            this.prototypesCache.set(key, response);
                        }
                    }),
                );
        }),
    );

    totalPages$ = this.paginatedPrototypes$.pipe(map((r) => r?.totalPages ?? 0));
    currentPage$ = this.page$.asObservable();
    totalCount$ = this.paginatedPrototypes$.pipe(map((r) => r?.total ?? 0));

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

    clearCache() {
        this.prototypesCache.clear();
        console.log('PROTOTYPES CACHE CLEARED');
    }

    getPrototypesByProject(projectId: number): Observable<PrototypeInterface[]> {
        const userId = this.userId;
        if (!userId) {
            return of([]);
        }
        return this.prototypesSupabaseService.getPrototypesByProject(projectId, userId);
    }

    addPrototype(projectId: number, prototype: Prototype) {
        const userId = this.userId;
        if (!userId) {
            console.error('User not authenticated');
            return;
        }
        this.prototypesSupabaseService.addPrototype(prototype, userId).subscribe({
            next: () => {
                this.clearCache();
                this.refresh$.next(projectId);
            },
            error: (err) => console.error('Error creating prototype', err),
        });
    }

    removeProto(protoId: number, projectId: number) {
        this.prototypesSupabaseService.moveToTrash(protoId).subscribe({
            next: () => {
                this.clearCache();

                this.refresh$.next(projectId);
            },
            error: (err) => {
                console.error('Error removing prototype', err);
            },
        });
    }

    getPrototypeById(
        projectId: number,
        prototypeId: number,
    ): Observable<PrototypeInterface | null> {
        const userId = this.userId;
        if (!userId) return of(null);
        return this.prototypesSupabaseService.getPrototypeById(projectId, prototypeId, userId);
    }

    searchPrototypesByName(query: string): Observable<PrototypeInterface[] | null> {
        const userId = this.userId;
        if (!userId) return of([]);
        return this.prototypesSupabaseService.searchPrototypesByName(query, userId);
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
