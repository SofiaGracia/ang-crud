import { inject, Injectable } from '@angular/core';
import { Project, ProjectInterface } from '@projects/interfaces/project.interface';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { PaginatedResponse } from '@shared/interfaces/paginated-response.interface';
import { BehaviorSubject, switchMap, of, Observable, combineLatest, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectsFacade {

    private projectSupabaseService = inject(ProjectSupabaseService);
    private limit = 8;

    private refresh$ = new BehaviorSubject<void>(undefined);
    private page$ = new BehaviorSubject<number>(1);

    projects$ = this.refresh$.pipe(switchMap(() => this.projectSupabaseService.getProjects()));

    paginatedProjects$ = combineLatest([this.refresh$, this.page$]).pipe(
        switchMap(([, page]) => this.projectSupabaseService.getProjectsPaginated(page, this.limit)),
    );

    totalPages$ = this.paginatedProjects$.pipe(map((r) => r.totalPages));
    currentPage$ = this.page$.asObservable();

    totalCount$ = this.paginatedProjects$.pipe(map((r) => r.total));

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
        switchMap((id) => (id == null ? of(null) : this.projectSupabaseService.getProjectById(id))),
    );

    // Select a project
    loadProject(id: number) {
        this.selectedProjectId$.next(id);
    }

    // Load the projects list
    loadProjects() {
        this.refresh$.next();
    }

    addProject(project: Project) {
        this.projectSupabaseService.addProject(project).subscribe({
            next: (data) => {
                this.refresh$.next();
            },
            error: (err) => {
                console.error('Error creating project', err);
            },
        });
    }

    removeProject(projectId: number) {
        this.projectSupabaseService.moveToTrash(projectId).subscribe({
            next: () => {
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
                this.refresh$.next();
            },
            error: (err) => {
                console.error('Error updating project', err);
            },
        });
    }

    searchProjectsByName(query: string): Observable<ProjectInterface[] | null>{

        return this.projectSupabaseService.searchProjectsByName(query);

    }
}
