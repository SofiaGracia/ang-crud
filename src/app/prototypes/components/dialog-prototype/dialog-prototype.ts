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

    // projectSupabaseService = inject(ProjectSupabaseService);
    // private projectsFacade = inject(ProjectsFacade);

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

    projectNameExistsValidator(prototypeService: PrototypesSupabaseService): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            if (!control.value) {
                return of(null);
            }

            return prototypeService.getProtoByName(control.value).pipe(
                map((exists) => (exists ? { protoNameExists: true } : null)),
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
        this.prototypesSupabaseService.getProtoByName(control.value!).subscribe((proto) => {
            if (proto) {
                // Alredy exists → set control's new error
                control.setErrors({ ...(control.errors || {}), protoNameExists: true });
                control.markAsTouched();
                return;
            }

            console.log('Creating prototype with data:', this.createForm.value);

            const newProto = {
                name: this.createForm.controls['name'].value!,
                description: this.createForm.controls['description'].value!,
            };

            // Consider capturing errors
            if (this.mode() === 'create') {
                // this.prototypesFacade.addProto(newProto);
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
