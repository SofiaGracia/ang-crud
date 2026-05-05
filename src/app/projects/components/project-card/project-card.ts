import { Component, inject, input, OnInit, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEllipsis, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ProjectsFacade } from '@projects/facades/projects.facade';
import { DialogProject } from '@projects/components/dialog-project/dialog-project';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { AuthFacade } from '@auth/facades/auth.facade';
import { PrototypesFacade } from '@prototypes/facades/prototypes.facades';

@Component({
    selector: 'project-card',
    imports: [RouterLink, FaIconComponent, DialogProject],
    templateUrl: './project-card.html',
})
export class ProjectCard implements OnInit {
    @ViewChild('dialogPro') dialogPro!: DialogProject;
    private static openDropdown: ProjectCard | null = null;

    project = input.required<ProjectInterface>();
    private projectsFacade = inject(ProjectsFacade);
    private prototypesFacade = inject(PrototypesFacade);
    private authFacade = inject(AuthFacade);
    private elementRef = inject(ElementRef);

    faEllipsis = faEllipsis;
    faPlus = faPlus;

    first4prototypes = signal<PrototypeInterface[]>([]);
    protoLength = signal<number>(0);
    isDropdownOpen = signal(false);

    displayDescription = computed(() => {
        const desc = this.project().description;
        return desc && desc !== '' ? desc : 'No description';
    });

    prototypeLabel = computed(() => {
        const count = this.protoLength();
        return `${count} prototype${count !== 1 ? 's' : ''}`;
    });

    toggleDropdown() {
        if (ProjectCard.openDropdown && ProjectCard.openDropdown !== this) {
            ProjectCard.openDropdown.isDropdownOpen.set(false);
        }
        this.isDropdownOpen.update(v => !v);
        if (this.isDropdownOpen()) {
            ProjectCard.openDropdown = this;
        } else {
            ProjectCard.openDropdown = null;
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (this.isDropdownOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
            this.isDropdownOpen.set(false);
            ProjectCard.openDropdown = null;
        }
    }

    get userId(): string | null {
        return this.authFacade.currentUserId;
    }

    ngOnInit() {
        const projectId = this.project().id;
        const userId = this.userId;
        if (projectId && userId) {
            this.prototypesFacade.getPrototypesByProject(projectId).subscribe({
                next: (protos) => {
                    this.protoLength.set(protos.length);
                    this.first4prototypes.set(protos.slice(0, 4));
                },
                error: () => {
                    this.protoLength.set(0);
                    this.first4prototypes.set([]);
                },
            });
        }
    }

    deleteProject(event: MouseEvent, id: number) {
        event.stopPropagation();
        this.isDropdownOpen.set(false);
        this.projectsFacade.removeProject(id);
    }

    openEditDialog() {
        this.isDropdownOpen.set(false);
        this.dialogPro.openDialog();
    }
}
