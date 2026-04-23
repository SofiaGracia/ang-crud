import { Component, effect, input, linkedSignal, output } from '@angular/core';
import { ProjectInterface } from '@projects/interfaces/project.interface';

@Component({
    selector: 'search-input',
    imports: [],
    templateUrl: './search-input.html',
})
export class SearchInput {
    //Input
    valuePlaceholder = input<string>('Buscar');
    searchedValue = output<string>();
    debounceTime = input(3000);
    initialValue = input<string>('');

    inputValue = linkedSignal<string>(() => this.initialValue());

    //List of objects searched
    projects = input.required<ProjectInterface[] | null>();

    errorMessage = input<string | unknown | null>();
    isLoading = input<boolean>(false);
    isEmpty = input<boolean>(false);

    debounceEffect = effect((onCleanup) => {
        const value = this.inputValue();

        const timeout = setTimeout(() => {
            this.searchedValue.emit(value);
        }, this.debounceTime());

        onCleanup(() => {
            clearTimeout(timeout);
        });

    });
}
