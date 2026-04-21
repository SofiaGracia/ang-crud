import { Component, input, output } from '@angular/core';

@Component({
    selector: 'confirm-modal',
    imports: [],
    templateUrl: './confirm-modal.html',
})
export class ConfirmModal {
    title = input<string>('');
    message = input<string>('');
    confirmText = input<string>('Confirm');
    cancelText = input<string>('Cancel');
    variant = input<'danger' | 'warning' | 'info'>('danger');

    isOpen = input<boolean>(false);

    confirm = output<void>();
    cancel = output<void>();
}
