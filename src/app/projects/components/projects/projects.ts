import { Component, ElementRef, inject, viewChild, ViewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProjectCard } from '@projects/project-card/project-card';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { DialogCreateProject } from '../dialog-create-project/dialog-create-project';

@Component({
    selector: 'app-projects',
    imports: [ProjectCard, DialogCreateProject],
    templateUrl: './projects.html',
})
export class Projects {
    projSupabaseService = inject(ProjectSupabaseService);

    projectsResource = rxResource({
        stream: () => this.projSupabaseService.getProjects(),
        defaultValue: [] as ProjectInterface[],
    });



}
