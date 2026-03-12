import { Component, inject, input } from '@angular/core';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { DialogCMProject } from '@projects/components/dialog-cm-project/dialog-cm-project';

@Component({
    selector: 'project-card',
    imports: [RouterLink, FaIconComponent, DialogCMProject],
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
