import { AfterViewInit, Component, inject } from '@angular/core';
import { ProjectsService } from '@projects/services/projects.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProjectCard } from '@projects/project-card/project-card';
import { Project } from '@projects/interfaces/project-response.interface';


@Component({
    selector: 'app-projects',
    imports: [ProjectCard],
    templateUrl: './projects.html',
})
export class Projects{
    private projectService = inject(ProjectsService);

    projectsResource = rxResource({
        stream: () => this.projectService.getProjects(),
        defaultValue: [] as Project[],
    });
}
