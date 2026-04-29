import { inject, Injectable } from '@angular/core';
import { Project, ProjectInterface } from '@projects/interfaces/project.interface';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { PaginatedResponse } from '@shared/interfaces/paginated-response.interface';
import { AuthFacade } from '@auth/facades/auth.facade';
import { BehaviorSubject, switchMap, of, Observable, combineLatest, map, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectsFacade {
    private projectSupabaseService = inject(ProjectSupabaseService);
    private authFacade = inject(AuthFacade);
    private limit = 8;

    private refresh$ = new BehaviorSubject<void>(undefined);
    private page$ = new BehaviorSubject<number>(1);

    private projectsCache = new Map<string, PaginatedResponse<ProjectInterface>>();
    private lastResponse: PaginatedResponse<ProjectInterface> | null = null;

    get userId(): string | null {
        return this.authFacade.currentUserId;
    }

    projects$ = this.refresh$.pipe(
        switchMap(() => {
            const userId = this.userId;
            return userId ? this.projectSupabaseService.getProjects(userId) : of([]);
        }),
    );

    paginatedProjects$ = combineLatest([this.refresh$, this.page$]).pipe(
        switchMap(([, page]) => {
            const key = `projects-${this.limit}-${page}`; // projects-8-1
            if (this.projectsCache.has(key)) {
                console.log('PROJECTS - DATA RESTORED FROM MAP: ');
                const cached = this.projectsCache.get(key)!;
                this.lastResponse = cached;
                return of(cached);
            }

            const userId = this.userId;
            if (!userId) {
                return of(null);
            }

            return this.projectSupabaseService.getProjectsPaginated(userId, page, this.limit).pipe(
                tap((response) => {
                    if (response) {
                        console.log('PROJECTS - DATA STORED IN MAP: ');
                        this.lastResponse = response;
                        this.projectsCache.set(key, response);
                    }
                }),
            );
        }),
    );

    totalPages$ = this.paginatedProjects$.pipe(map((r) => r?.totalPages ?? 0));
    currentPage$ = this.page$.asObservable();

    totalCount$ = this.paginatedProjects$.pipe(map((r) => r?.total ?? 0));

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

    // Subject to select a project
    private selectedProjectId$ = new BehaviorSubject<number | null>(null);

    project$ = this.selectedProjectId$.pipe(
        switchMap((id) => {
            const userId = this.userId;
            if (id == null || !userId) return of(null);
            return this.projectSupabaseService.getProjectById(id, userId);
        }),
    );

    // Select a project
    loadProject(id: number) {
        this.selectedProjectId$.next(id);
    }

    // Load the projects list
    loadProjects() {
        this.refresh$.next();
    }

    clearCache() {
        this.projectsCache.clear();
        console.log('PROJECTS CACHE CLEARED');
    }

    addProject(project: Project) {
        const userId = this.userId;
        if (!userId) {
            console.error('User not authenticated');
            return;
        }
        this.projectSupabaseService.addProject(project, userId).subscribe({
            next: () => {
                this.clearCache();
                this.refresh$.next();
            },
            error: (err) => {
                console.error('Error creating project', err);
            },
        });
    }

    removeProject(projectId: number) {
        const currentPage = this.page$.value;
        const currentTotal = this.lastResponse?.total ?? 0;

        this.projectSupabaseService.moveToTrash(projectId).subscribe({
            next: () => {
                this.clearCache();

                const newTotal = currentTotal - 1;
                const newTotalPages = Math.ceil(newTotal / this.limit);

                if (currentPage > newTotalPages) {
                    this.page$.next(Math.max(1, newTotalPages));
                }

                this.refresh$.next();
            },
            error: (err) => {
                console.error('Error removing project', err);
            },
        });
    }

    updateProject(projectId: number, dataToUpdate: Project) {
        this.projectSupabaseService.updateProject(projectId, dataToUpdate).subscribe({
            next: () => {
                this.clearCache();
                this.refresh$.next();
            },
            error: (err) => {
                console.error('Error updating project', err);
            },
        });
    }

    searchProjectsByName(query: string): Observable<ProjectInterface[] | null> {
        const userId = this.userId;
        if (!userId) return of([]);
        return this.projectSupabaseService.searchProjectsByName(query, userId);
    }
}
