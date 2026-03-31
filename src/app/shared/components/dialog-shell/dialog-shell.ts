import { JsonPipe } from '@angular/common';
import { Component, ElementRef, input, viewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'dialog-shell',
    imports: [ReactiveFormsModule, JsonPipe],
    templateUrl: './dialog-shell.html',
})
export class DialogShell {
    entityName = input.required<string>();
    placeholder = input.required<string>();
    createForm = input.required<FormGroup>();
    submitFn = input.required<(e: Event) => void>();
    errorsFn = input.required<() => string[]>();
    onClose = input.required<() => void>();

    // ✅ Ací sí que funciona perquè #dialogRef és al seu template
    private dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogRef');

    openDialog() {
        this.dialogRef().nativeElement.showModal();
    }

    closeDialog() {
        this.dialogRef().nativeElement.close();
    }
}
