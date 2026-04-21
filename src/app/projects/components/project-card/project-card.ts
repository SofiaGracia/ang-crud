import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEllipsis, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { DialogProject } from '@projects/components/dialog-project/dialog-project';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';

@Component({
    selector: 'project-card',
    imports: [RouterLink, FaIconComponent, DialogProject],
    templateUrl: './project-card.html',
})
export class ProjectCard implements OnInit {
    project = input.required<ProjectInterface>();
    private projectsFacade = inject(ProjectsFacade);
    private prototypesService = inject(PrototypesSupabaseService);

    faEllipsis = faEllipsis;
    faPlus = faPlus;

    prototypes = signal<PrototypeInterface[]>([]);

    ngOnInit() {
        const projectId = this.project().id;
        if (projectId) {
            this.prototypesService.getFirstPrototypesByProject(projectId, 4).subscribe({
                next: (protos) => this.prototypes.set(protos),
                error: () => this.prototypes.set([]),
            });
        }
    }

    deleteProject(event: MouseEvent, id: number) {
        event.stopPropagation();
        this.projectsFacade.removeProject(id);
    }
}
