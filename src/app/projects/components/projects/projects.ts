import { Component, inject } from '@angular/core';
import { ProjectCard } from '@projects/components/project-card/project-card';
import { DialogProject } from '../dialog-project/dialog-project';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-projects',
    imports: [ProjectCard, DialogProject, AsyncPipe],
    templateUrl: './projects.html',
})
export class Projects {

    private projectsFacade = inject(ProjectsFacade);

    projects$ = this.projectsFacade.projects$;
}
