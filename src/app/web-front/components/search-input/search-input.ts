import { Component, effect, inject, input, linkedSignal, output } from '@angular/core';
import { Router } from '@angular/router';
import { SearchResultItem, SearchResults } from '@web-front/interfaces/search-result.interface';

@Component({
    selector: 'search-input',
    imports: [],
    templateUrl: './search-input.html',
})
export class SearchInput {
    private router = inject(Router);

    //Input
    valuePlaceholder = input<string>('Buscar');
    searchedValue = output<string>();
    clearResults = output<void>();
    debounceTime = input(3000);
    initialValue = input<string>('');

    inputValue = linkedSignal<string>(() => this.initialValue());

    //List of objects searched
    searchResults = input.required<SearchResults>();

    errorMessage = input<string | unknown | null>();
    isLoading = input<boolean>(false);
    isEmpty = input<boolean>(false);

    // component .ts
    readonly dropdownClosed = output<void>();

    debounceEffect = effect((onCleanup) => {
        const value = this.inputValue();

        const timeout = setTimeout(() => {
            this.searchedValue.emit(value);
        }, this.debounceTime());

        onCleanup(() => {
            clearTimeout(timeout);
        });
    });

    onItemClick(item: SearchResultItem): void {
        if (item.type === 'project') {
            this.router.navigate(['/projects', item.id]);
        } else if (item.type === 'prototype') {
            this.router.navigate(['/projects', item.project_id, 'prototypes', item.id]);
        }
        this.clearResults.emit();
    }
}
