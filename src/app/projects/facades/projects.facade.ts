import { inject, Injectable } from '@angular/core';
import { Project } from '@projects/interfaces/project.interface';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { BehaviorSubject, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectsFacade {
    private refresh$ = new BehaviorSubject<void>(undefined);
    private projectSupabaseService = inject(ProjectSupabaseService);

    projects$ = this.refresh$.pipe(switchMap(() => this.projectSupabaseService.getProjects()));

    loadProjects() {
        this.refresh$.next();
    }

    addProject(project: Project) {
        this.projectSupabaseService.addProject(project).subscribe({
            next: (data) => {
                console.log('Project created', data);
                this.refresh$.next();
            },
            error: (err) => {
                console.error('Error creating project', err);
            },
        });
    }

    removeProject(projectId: number) {
        this.projectSupabaseService.removeProject(projectId).subscribe({
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
}
