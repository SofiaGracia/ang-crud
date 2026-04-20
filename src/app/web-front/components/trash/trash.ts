import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash, faRotateBack, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';

@Component({
    selector: 'app-trash',
    imports: [FaIconComponent, DatePipe],
    templateUrl: './trash.html',
})
export class Trash implements OnInit {
    private projectsService = inject(ProjectSupabaseService);
    private prototypesService = inject(PrototypesSupabaseService);

    trashedProjects = signal<ProjectInterface[]>([]);
    trashedPrototypes = signal<PrototypeInterface[]>([]);
    loading = signal(true);

    activeTab = signal<'projects' | 'prototypes'>('projects');

    faTrash = faTrash;
    faRotateBack = faRotateBack;
    faTrashCan = faTrashCan;

    ngOnInit() {
        this.loadTrash();
    }

    setActiveTab(tab: 'projects' | 'prototypes') {
        this.activeTab.set(tab);
    }

    private loadTrash() {
        this.loading.set(true);
        this.projectsService.getTrashedProjects().subscribe({
            next: (projects) => {
                this.trashedProjects.set(projects);
                this.loading.set(false);
            },
            error: (err) => console.error('Error loading trashed projects', err),
        });
        this.prototypesService.getTrashedPrototypes().subscribe({
            next: (protos) => {
                this.trashedPrototypes.set(protos);
                this.loading.set(false);
            },
            error: (err) => console.error('Error loading trashed prototypes', err),
        });
    }

    restoreProject(id: number) {
        this.projectsService.restoreProject(id).subscribe({
            next: () => {
                this.loadTrash();
            },
            error: (err) => console.error('Error restoring project', err),
        });
    }

    restorePrototype(id: number) {
        this.prototypesService.restorePrototype(id).subscribe({
            next: () => {
                this.loadTrash();
            },
            error: (err) => console.error('Error restoring prototype', err),
        });
    }

    permanentDeleteProject(id: number) {
        this.projectsService.permanentDeleteProject(id).subscribe({
            next: () => {
                this.loadTrash();
            },
            error: (err) => console.error('Error deleting project', err),
        });
    }

    permanentDeletePrototype(id: number) {
        this.prototypesService.permanentDeletePrototype(id).subscribe({
            next: () => {
                this.loadTrash();
            },
            error: (err) => console.error('Error deleting prototype', err),
        });
    }
}