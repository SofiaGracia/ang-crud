import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash, faRotateBack, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { ConfirmModal } from '@shared/components/confirm-modal/confirm-modal';
import { AuthFacade } from '@auth/facades/auth.facade';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';

@Component({
    selector: 'app-trash',
    imports: [FaIconComponent, DatePipe, ConfirmModal],
    templateUrl: './trash.html',
})
export class Trash implements OnInit {
    private projectsService = inject(ProjectSupabaseService);
    private prototypesService = inject(PrototypesSupabaseService);
    private authFacade = inject(AuthFacade);

    private projectsFacade = inject(ProjectsFacade);
    private prototypesFacade = inject(PrototypesFacade);

    trashedProjects = signal<ProjectInterface[]>([]);
    trashedPrototypes = signal<PrototypeInterface[]>([]);
    loading = signal(true);

    activeTab = signal<'projects' | 'prototypes'>('projects');

    showDeleteModal = signal(false);
    itemToDelete = signal<{ id: number; name: string; type: 'project' | 'prototype' } | null>(
        null,
    );

    faTrash = faTrash;
    faRotateBack = faRotateBack;
    faTrashCan = faTrashCan;

    get userId(): string | null {
        return this.authFacade.currentUserId;
    }

    ngOnInit() {
        this.loadTrash();
    }

    setActiveTab(tab: 'projects' | 'prototypes') {
        this.activeTab.set(tab);
    }

    private loadTrash() {
        const userId = this.userId;
        if (!userId) return;

        this.loading.set(true);
        this.projectsService.getTrashedProjects(userId).subscribe({
            next: (projects) => {
                this.trashedProjects.set(projects);
                this.loading.set(false);
            },
            error: (err) => console.error('Error loading trashed projects', err),
        });
        this.prototypesService.getTrashedPrototypes(userId).subscribe({
            next: (protos) => {
                this.trashedPrototypes.set(protos);
                this.loading.set(false);
            },
            error: (err) => console.error('Error loading trashed prototypes', err),
        });
    }

    restoreProject(id: number) {
        this.projectsFacade.restoreProjectFromTrash(id).subscribe({
            next: () => this.loadTrash(),
            error: (err) => console.error('Error restoring project', err),
        });
    }

    restorePrototype(id: number) {
        this.prototypesService.restorePrototype(id).subscribe({
            next: () => {
                this.prototypesFacade.clearCache();
                this.loadTrash();
            },
            error: (err) => console.error('Error restoring prototype', err),
        });
    }

    openDeleteModal(id: number, name: string, type: 'project' | 'prototype') {
        this.itemToDelete.set({ id, name, type });
        this.showDeleteModal.set(true);
    }

    closeDeleteModal() {
        this.showDeleteModal.set(false);
        this.itemToDelete.set(null);
    }

    confirmDelete() {
        const item = this.itemToDelete();
        if (!item) return;

        if (item.type === 'project') {
            this.permanentDeleteProject(item.id);
        } else {
            this.permanentDeletePrototype(item.id);
        }
        this.closeDeleteModal();
    }

    permanentDeleteProject(id: number) {
        this.projectsFacade.permanentDeleteProjectFromTrash(id).subscribe({
            next: () => this.loadTrash(),
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
