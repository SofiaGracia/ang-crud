import { JsonPipe } from '@angular/common';
import { Component, effect, ElementRef, inject, input, ViewChild } from '@angular/core';
import {
    AbstractControl,
    AsyncValidatorFn,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { Observable, of, map, catchError } from 'rxjs';

@Component({
    selector: 'dialog-prototype',
    imports: [ReactiveFormsModule, JsonPipe],
    templateUrl: './dialog-prototype.html',
})
export class DialogPrototype {
    @ViewChild('dialogPro') dialogPro!: ElementRef<HTMLDialogElement>;
    mode = input.required<'create' | 'edit'>();

    prototype = input<PrototypeInterface | undefined>();
    project = input.required<ProjectInterface>();

    selectedHtmlFile: File | null = null;

    prototypesSupabaseService = inject(PrototypesSupabaseService);
    private prototypesFacade = inject(PrototypesFacade);

    fb = inject(FormBuilder);

    createForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
    });

    constructor() {
        effect(() => {
            const prototype = this.prototype();

            if (prototype) {
                this.createForm.patchValue({
                    name: prototype.name,
                    description: prototype.description,
                });
            }
        });
    }

    errorsName(): string[] {
        const errors = this.createForm.controls['name'].errors;
        if (!errors) return [];

        const messages: string[] = [];

        if (errors['required']) {
            messages.push("Don't forget to name your prototype");
        }

        if (errors['protoNameExists']) {
            messages.push('Try a different name. You already have a prototype with this name!');
        }

        return messages;
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedHtmlFile = input.files[0];
        }
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
        this.prototypesSupabaseService.getProtoByName(control.value!).subscribe(async (proto) => {
            if (proto && proto.project_id === this.project().id) {
                control.setErrors({ ...(control.errors || {}), protoNameExists: true });
                control.markAsTouched();
                return;
            }

            let publicUrl = null;
            if (this.selectedHtmlFile !== null) {
                publicUrl = await this.prototypesSupabaseService.uploadPrototypeFile(
                    this.selectedHtmlFile,
                    this.project().id,
                );
            }
            console.log('Creating prototype with data:', this.createForm.value);

            const newProto = {
                name: this.createForm.controls['name'].value!,
                description: this.createForm.controls['description'].value!,
                project_id: this.project().id,
                url: publicUrl,
                tool: null,
            };

            console.log('Values of new prototype:', newProto);

            // Consider capturing errors
            if (this.mode() === 'create') {
                this.prototypesFacade.addPrototype(this.project().id, newProto);
                console.log('CREATE PROTOTYPE');
            } else {
                // const idProject = this.prototype()!.id; // Is never going to be undefined because we are modifying
                // this.prototypesFacade.updateProto(idProject, newProto);
                console.log('UPDATE PROTOTYPE');
            }

            // Reset form
            this.createForm.reset();
            this.closeModal();
        });
    }

    openDialog() {
        this.dialogPro.nativeElement.showModal();
    }

    closeModal() {
        this.dialogPro.nativeElement.close();
    }
}
