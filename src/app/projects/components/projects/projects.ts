import { Component, ElementRef, inject, viewChild, ViewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProjectCard } from '@projects/project-card/project-card';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { DialogCMProject } from '../dialog-cm-project/dialog-cm-project';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-projects',
    imports: [ProjectCard, DialogCMProject, AsyncPipe],
    templateUrl: './projects.html',
})
export class Projects {

    private projectsFacade = inject(ProjectsFacade);

    projects$ = this.projectsFacade.projects$;
}
