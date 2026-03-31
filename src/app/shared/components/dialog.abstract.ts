import { Directive, input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Directive()
export abstract class DialogBase<T> {
    mode = input.required<'create' | 'edit'>();

    // El form l'ha de definir cada fill
    abstract createForm: FormGroup;

    abstract getEntity(): T | undefined;
    abstract getErrorKey(): string;
    abstract handleSubmit(name: string, description: string): void;

    errorsName(): string[] {
        const errors = this.createForm.controls['name'].errors;
        if (!errors) return [];
        const messages: string[] = [];
        if (errors['required']) messages.push("Don't forget to name your " + this.getErrorKey());
        if (errors['nameExists'])
            messages.push(
                'Try a different name. You already have a ' +
                    this.getErrorKey() +
                    ' with this name!',
            );
        return messages;
    }

    onSubmit(event: Event) {
        event.preventDefault();
        const control = this.createForm.get('name');
        if (!control) return;
        control.markAsTouched();
        this.createForm.updateValueAndValidity();
        if (this.createForm.invalid) return;
        this.handleSubmit(control.value!, this.createForm.controls['description'].value!);
    }
}
