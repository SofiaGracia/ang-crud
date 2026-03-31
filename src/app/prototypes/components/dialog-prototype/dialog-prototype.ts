import { JsonPipe } from '@angular/common';
import { Component, effect, inject, input, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { DialogShell } from '@shared/components/dialog-shell/dialog-shell';
import { DialogBase } from '@shared/components/dialog.abstract';

@Component({
    selector: 'dialog-prototype',
    imports: [ReactiveFormsModule, JsonPipe, DialogShell],
    templateUrl: './dialog-prototype.html',
})
export class DialogPrototype extends DialogBase<PrototypeInterface> {
    private shell = viewChild.required<DialogShell>('shell');
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
        return this.prototype();
    }
    getErrorKey() {
        return 'prototype';
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedHtmlFile = input.files[0];
        }
    }

    handleSubmit(name: string) {
        // First sync validations in abstract class

        // Second async validation ONLY when submit
        this.prototypesSupabaseService.getProtoByName(name).subscribe(async (proto) => {
            if (proto && proto.project_id === this.project().id) {
                const control = this.createForm.get('name')!;
                control.setErrors({ ...(control.errors || {}), nameExists: true });
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
            this.selectedHtmlFile = null;
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
