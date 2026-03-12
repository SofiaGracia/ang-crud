import { Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import {
    AbstractControl,
    AsyncValidatorFn,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { Observable, of, map, catchError } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { Project, ProjectInterface } from '@projects/interfaces/project.interface';
import { ProjectsFacade } from '@projects/facades/projects.facade';

@Component({
    selector: 'dialog-create-project',
    imports: [ReactiveFormsModule, JsonPipe],
    templateUrl: './dialog-create-project.html',
})
export class DialogCreateProject {
    @ViewChild('dialogCreate') dialogCreate!: ElementRef<HTMLDialogElement>;

    projectSupabaseService = inject(ProjectSupabaseService);
    private projectsFacade = inject(ProjectsFacade);
    fb = inject(FormBuilder);

    createForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
    });

    errorsName(): string[] {
        const errors = this.createForm.controls['name'].errors;
        if (!errors) return [];

        const messages: string[] = [];

        if (errors['required']) {
            messages.push("Don't forget to name your project");
        }

        if (errors['projectNameExists']) {
            messages.push('Try a different name. You already have a project with this name!');
        }

        return messages;
    }

    projectNameExistsValidator(projectService: ProjectSupabaseService): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            if (!control.value) {
                return of(null);
            }

            return projectService.getProjectByName(control.value).pipe(
                map((exists) => (exists ? { projectNameExists: true } : null)),
                catchError(() => of(null)),
            );
        };
    }

    onSubmit(event: Event) {
        event.preventDefault();

        const control = this.createForm.get('name');
        if (!control) return;

        // First sync validations
        control.markAsTouched();
        this.createForm.updateValueAndValidity();
        if (this.createForm.invalid) {
            return;
        }

        // Second async validation ONLY when submit
        this.projectSupabaseService.getProjectByName(control.value!).subscribe((project) => {
            if (project) {
                // Alredy exists → set control's new error
                control.setErrors({ ...(control.errors || {}), projectNameExists: true });
                control.markAsTouched();
                return;
            }

            console.log('Creating project with data:', this.createForm.value);

            const newProject: Project = {
                name: this.createForm.controls['name'].value!,
                description: this.createForm.controls['description'].value!,
            };

            // Consider capturing errors
            this.projectsFacade.addProject(newProject);

            // Reset form
            this.createForm.reset();
            this.closeModal();

        });
    }

    openDialog() {
        this.dialogCreate.nativeElement.showModal();
    }

    closeModal() {
        this.dialogCreate.nativeElement.close();
    }
}
