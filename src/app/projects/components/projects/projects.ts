import { Component, inject, linkedSignal } from '@angular/core';
import { ProjectCard } from '@projects/components/project-card/project-card';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { AsyncPipe } from '@angular/common';
import { DialogProject } from '../dialog-project/dialog-project';
import { SearchInput } from '@web-front/components/search-input/search-input';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { of } from 'rxjs';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';

@Component({
    selector: 'app-projects',
    imports: [ProjectCard, DialogProject, AsyncPipe, SearchInput],
    templateUrl: './projects.html',
})
export class Projects {
    private projectsFacade = inject(ProjectsFacade);

    projects$ = this.projectsFacade.projects$;

    projectsService = inject(ProjectSupabaseService);

    queryP = linkedSignal(() => '');

    projectsResource = rxResource<ProjectInterface[] | null, { query: string }>({
        // definim com a params una funció que retorna l'objecte de paràmetres
        params: () => ({ query: this.queryP() }),
        // definim stream, que rep l'objecte params i retorna l’Observable
        stream: ({ params }) => {
            if (!params.query) {
                return of<ProjectInterface[] | null>(null);
            }

            return this.projectsService.searchProjectsByName(params.query);
        },
        defaultValue: [] as ProjectInterface[],
    });
}
