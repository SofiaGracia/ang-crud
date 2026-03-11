import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
    selector: 'dialog-create-project',
    imports: [],
    templateUrl: './dialog-create-project.html',
})
export class DialogCreateProject {
    @ViewChild('dialogCreate') dialogCreate!: ElementRef<HTMLDialogElement>;

    openDialog() {
        this.dialogCreate.nativeElement.showModal();
    }

    closeModal() {
        this.dialogCreate.nativeElement.close();
    }
}
