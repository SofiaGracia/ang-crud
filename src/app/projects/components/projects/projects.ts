import { Component, inject, linkedSignal } from '@angular/core';
import { ProjectCard } from '@projects/components/project-card/project-card';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { AsyncPipe } from '@angular/common';
import { DialogProject } from '../dialog-project/dialog-project';
import { SearchInput } from '@web-front/components/search-input/search-input';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchResultItem, SearchResults } from '@web-front/interfaces/search-result.interface';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';

@Component({
    selector: 'app-projects',
    imports: [ProjectCard, DialogProject, AsyncPipe, SearchInput],
    templateUrl: './projects.html',
})
export class Projects {
    private projectsFacade = inject(ProjectsFacade);
    private prototypesFacade = inject(PrototypesFacade);

    projects$ = this.projectsFacade.projects$;

    queryP = linkedSignal(() => '');

    searchResultsResource = rxResource<SearchResults, { query: string }>({
        params: () => ({ query: this.queryP() }),
        stream: ({ params }) => {
            if (!params.query) {
                return of<SearchResults>(null);
            }

            return forkJoin({
                projects: this.projectsFacade.searchProjectsByName(params.query),
                prototypes: this.prototypesFacade.searchPrototypesByName(params.query),
            }).pipe(
                map(({ projects, prototypes }) => {
                    if (!projects || !prototypes) {
                        return null;
                    }
                    const projectResults: SearchResultItem[] = projects.map((p) => ({
                        ...p,
                        type: 'project' as const,
                    }));
                    const prototypeResults: SearchResultItem[] = prototypes.map((p) => ({
                        ...p,
                        type: 'prototype' as const,
                    }));
                    return [...projectResults, ...prototypeResults];
                }),
            );
        },
        defaultValue: null,
    });
}
