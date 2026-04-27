import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import {
    RecentPrototypesService,
    RecentPrototype,
} from '@prototypes/services/recent-prototypes.service';
import { PrototypesSupabaseService } from '@prototypes/services/prototypesSupabase.service';
import { ProjectSupabaseService } from '@projects/services/projectsSupabase.service';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { AuthFacade } from '@auth/facades/auth.facade';

export interface RecentPrototypeWithDetails {
    prototype: PrototypeInterface;
    project: ProjectInterface;
    timestamp: number;
}

@Component({
    selector: 'recent-prototypes',
    imports: [RouterLink, FaIconComponent],
    templateUrl: './recent-prototypes.html',
})
export class RecentPrototypes implements OnInit {
    private recentService = inject(RecentPrototypesService);
    private prototypesService = inject(PrototypesSupabaseService);
    private projectsService = inject(ProjectSupabaseService);
    private authFacade = inject(AuthFacade);

    recentPrototypes = signal<RecentPrototypeWithDetails[]>([]);
    loading = signal(true);

    faClock = faClock;

    get userId(): string | null {
        return this.authFacade.currentUserId;
    }

    async ngOnInit() {
        const userId = this.userId;
        if (!userId) {
            this.loading.set(false);
            return;
        }

        const recent = this.recentService.getRecentPrototypes();

        if (recent.length === 0) {
            this.loading.set(false);
            return;
        }

        const results: RecentPrototypeWithDetails[] = [];

        for (const item of recent) {
            try {
                const [prototype, project] = await Promise.all([
                    this.getPrototype(item.projectId, item.prototypeId, userId),
                    this.getProject(item.projectId, userId),
                ]);

                if (prototype && project) {
                    results.push({
                        prototype,
                        project,
                        timestamp: item.timestamp,
                    });
                }
            } catch (err) {
                console.error('Error loading recent prototype', err);
            }
        }

        this.recentPrototypes.set(results);
        this.loading.set(false);
    }

    private getPrototype(
        projectId: number,
        prototypeId: number,
        userId: string,
    ): Promise<PrototypeInterface | null> {
        return new Promise((resolve) => {
            this.prototypesService
                .getPrototypeById(projectId, prototypeId, userId)
                .subscribe((proto) => resolve(proto));
        });
    }

    private getProject(projectId: number, userId: string): Promise<ProjectInterface | null> {
        return new Promise((resolve) => {
            this.projectsService.getProjectById(projectId, userId).subscribe((proj) => resolve(proj));
        });
    }
}
