import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEllipsis, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { DialogProject } from '@projects/components/dialog-project/dialog-project';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { AuthFacade } from '@auth/facades/auth.facade';

@Component({
    selector: 'project-card',
    imports: [RouterLink, FaIconComponent, DialogProject],
    templateUrl: './project-card.html',
})
export class ProjectCard implements OnInit {
    project = input.required<ProjectInterface>();
    private projectsFacade = inject(ProjectsFacade);
    private prototypesService = inject(PrototypesSupabaseService);
    private authFacade = inject(AuthFacade);

    faEllipsis = faEllipsis;
    faPlus = faPlus;

    prototypes = signal<PrototypeInterface[]>([]);

    get userId(): string | null {
        return this.authFacade.currentUserId;
    }

    ngOnInit() {
        const projectId = this.project().id;
        const userId = this.userId;
        if (projectId && userId) {
            this.prototypesService.getFirstPrototypesByProject(projectId, userId, 4).subscribe({
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
