import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'pagination',
    imports: [CommonModule],
    templateUrl: './pagination.html',
})
export class Pagination {
    @Input() currentPage = 1;
    @Input() totalPages = 1;
    @Input() total = 0;
    @Input() limit = 8;

    @Output() pageChange = new EventEmitter<number>();

    get visiblePages(): number[] {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, this.currentPage - 2);
        let end = Math.min(this.totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    get showEllipsisStart(): boolean {
        return this.visiblePages[0] > 2;
    }

    get showEllipsisEnd(): boolean {
        return this.visiblePages[this.visiblePages.length - 1] < this.totalPages - 1;
    }

    get hasPrev(): boolean {
        return this.currentPage > 1;
    }

    get hasNext(): boolean {
        return this.currentPage < this.totalPages;
    }

    getShowingInfo(): string {
        const from = (this.currentPage - 1) * this.limit + 1;
        const to = Math.min(this.currentPage * this.limit, this.total);
        return `Showing ${from}-${to} of ${this.total}`;
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.pageChange.emit(page);
        }
    }

    prev() {
        this.goToPage(this.currentPage - 1);
    }

    next() {
        this.goToPage(this.currentPage + 1);
    }
}