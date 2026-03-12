import { Component, ElementRef, inject, viewChild, ViewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProjectCard } from '@projects/project-card/project-card';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { DialogCreateProject } from '../dialog-create-project/dialog-create-project';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-projects',
    imports: [ProjectCard, DialogCreateProject, AsyncPipe],
    templateUrl: './projects.html',
})
export class Projects {

    private projectsFacade = inject(ProjectsFacade);

    projects$ = this.projectsFacade.projects$;
}
