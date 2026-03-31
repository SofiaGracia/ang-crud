import { Component, inject, input } from '@angular/core';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { DialogProject } from '@projects/components/dialog-project/dialog-project';

@Component({
    selector: 'project-card',
    imports: [RouterLink, FaIconComponent, DialogProject],
    templateUrl: './project-card.html',
})
export class ProjectCard {
    project = input.required<ProjectInterface>();
    private projectsFacade = inject(ProjectsFacade);


    faEllipsis = faEllipsis;

    deleteProject(event: MouseEvent, id: number) {
        event.stopPropagation();
        this.projectsFacade.removeProject(id);
        console.log('Project removed')
    }
}
