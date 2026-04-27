import { Component, effect, inject, input, viewChild } from '@angular/core';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { FormBuilder, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { Project, ProjectInterface } from '@projects/interfaces/project.interface';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { DialogBase } from '@shared/components/dialog.abstract';
import { DialogShell } from '@shared/components/dialog-shell/dialog-shell';
import { AuthFacade } from '@auth/facades/auth.facade';

@Component({
    selector: 'dialog-project',
    imports: [DialogShell, JsonPipe],
    templateUrl: './dialog-project.html',
})
export class DialogProject extends DialogBase<ProjectInterface> {
    project = input<ProjectInterface | undefined>();

    private shell = viewChild.required<DialogShell>('shell');

    private projectsFacade = inject(ProjectsFacade);
    projectSupabaseService = inject(ProjectSupabaseService);
    private authFacade = inject(AuthFacade);

    fb = inject(FormBuilder);

    createForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
    });

    get userId(): string | null {
        return this.authFacade.currentUserId;
    }

    constructor() {
        super();
        effect(() => {
            const entity = this.getEntity();
            if (entity) {
                this.createForm.patchValue({
                    name: entity.name,
                    description: entity.description,
                });
            }
        });
    }

    getEntity() {
        return this.project();
    }
    getErrorKey() {
        return 'project';
    }

    handleSubmit(name: string) {
        const userId = this.userId;
        if (!userId) {
            console.error('User not authenticated');
            return;
        }

        this.projectSupabaseService.getProjectByName(name, userId).subscribe((project) => {
            if (project) {
                const control = this.createForm.get('name')!;
                control.setErrors({ ...control.errors, nameExists: true });
                control.markAsTouched();
                return;
            }

            const newProject: Project = {
                name: this.createForm.controls['name'].value!,
                description: this.createForm.controls['description'].value!,
            };

            if (this.mode() === 'create') {
                this.projectsFacade.addProject(newProject);
            } else {
                const idProject = this.project()!.id;
                this.projectsFacade.updateProject(idProject, newProject);
            }

            this.createForm.reset();
            this.closeModal();
        });
    }

    openDialog() {
        this.shell().openDialog();
    }

    closeModal() {
        this.shell().closeDialog();
        this.createForm.reset();
    }
}
