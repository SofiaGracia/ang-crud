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

    recentPrototypes = signal<RecentPrototypeWithDetails[]>([]);
    loading = signal(true);

    faClock = faClock;

    async ngOnInit() {
        const recent = this.recentService.getRecentPrototypes();

        if (recent.length === 0) {
            this.loading.set(false);
            return;
        }

        const results: RecentPrototypeWithDetails[] = [];

        for (const item of recent) {
            try {
                const [prototype, project] = await Promise.all([
                    this.getPrototype(item.projectId, item.prototypeId),
                    this.getProject(item.projectId),
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
    ): Promise<PrototypeInterface | null> {
        return new Promise((resolve) => {
            this.prototypesService
                .getPrototypeById(projectId, prototypeId)
                .subscribe((proto) => resolve(proto));
        });
    }

    private getProject(projectId: number): Promise<ProjectInterface | null> {
        return new Promise((resolve) => {
            this.projectsService.getProjectById(projectId).subscribe((proj) => resolve(proj));
        });
    }
}
