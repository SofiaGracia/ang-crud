import { inject, Injectable } from '@angular/core';
import { Project, ProjectInterface } from '@projects/interfaces/project.interface';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { BehaviorSubject, switchMap, of, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectsFacade {

    // Subject to refresh the projects list
    private refresh$ = new BehaviorSubject<void>(undefined);
    private projectSupabaseService = inject(ProjectSupabaseService);

    projects$ = this.refresh$.pipe(switchMap(() => this.projectSupabaseService.getProjects()));

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

    // searchByProject(query: string): Observable<ProjectInterface[]>{

    //     this.projectSupabaseService.searchProjectsByName(query).subscribe({
    //         next: (something) => {
    //             this.refresh$.next();
    //             console.log(something);
    //             return something;
    //         },
    //         error: (err) => {
    //             console.error('Error updating project', err);
    //         },
    //     });

    // }
}
