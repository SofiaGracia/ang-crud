import { Injectable, inject } from '@angular/core';
import { Observable, from, map, forkJoin } from 'rxjs';
import { Project, ProjectInterface } from '@projects/interfaces/project.interface';
import { SupabaseClientService } from '@shared/services/supabase-client.service';
import { PaginatedResponse } from '@shared/interfaces/paginated-response.interface';

@Injectable({ providedIn: 'root' })
export class ProjectSupabaseService {
    private supabase = inject(SupabaseClientService).instance;

    getProjects(): Observable<ProjectInterface[]> {
        const promise = this.supabase.from('projects').select('*').is('deleted_at', null);
        return from(promise).pipe(
            map((response) => {
                return response.data ?? [];
            }),
        );
    }

    getProjectsPaginated(
        page: number,
        limit: number = 8,
    ): Observable<PaginatedResponse<ProjectInterface>> {
        const fromIndex = (page - 1) * limit;
        const toIndex = fromIndex + limit - 1;

        const countPromise = this.supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null);

        const dataPromise = this.supabase
            .from('projects')
            .select('*')
            .is('deleted_at', null)
            .range(fromIndex, toIndex);

        return forkJoin({
            countResponse: from(countPromise),
            dataResponse: from(dataPromise),
        }).pipe(
            map(({ countResponse, dataResponse }) => {
                const total = countResponse.count ?? 0;
                const data = dataResponse.data ?? [];
                const totalPages = Math.ceil(total / limit);
                return {
                    data,
                    total,
                    page,
                    limit,
                    totalPages,
                };
            }),
        );
    }

    getProjectByName(name: string): Observable<ProjectInterface | null> {
        const promise = this.supabase.from('projects').select('*').eq('name', name).maybeSingle();
        return from(promise).pipe(map((response) => response.data));
    }

    getProjectById(id: number): Observable<ProjectInterface | null> {
        const promise = this.supabase.from('projects').select('*').eq('id', id).maybeSingle();
        return from(promise).pipe(map((response) => response.data));
    }

    addProject(project: Project): Observable<ProjectInterface> {
        const promise = this.supabase.from('projects').insert(project).select('*').single();
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return response.data;
            }),
        );
    }

    moveToTrash(projectId: number): Observable<void> {
        const promise = this.supabase
            .from('projects')
            .update({ deleted_at: new Date().toISOString() } as any)
            .eq('id', projectId);
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return;
            }),
        );
    }

    getTrashedProjects(): Observable<ProjectInterface[]> {
        const promise = this.supabase
            .from('projects')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });
        return from(promise).pipe(
            map((response) => {
                return response.data ?? [];
            }),
        );
    }

    restoreProject(projectId: number): Observable<void> {
        const promise = this.supabase
            .from('projects')
            .update({ deleted_at: null } as any)
            .eq('id', projectId);
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return;
            }),
        );
    }

    permanentDeleteProject(projectId: number): Observable<void> {
        const promise = this.supabase.from('projects').delete().eq('id', projectId);
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return;
            }),
        );
    }

    updateProject(projectId: number, dataToUpdate: Project): Observable<void> {
        const promise = this.supabase.from('projects').update(dataToUpdate).eq('id', projectId);
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return;
            }),
        );
    }

    searchProjectsByName(query: string): Observable<ProjectInterface[] | null> {
        const promise = this.supabase
            .from('projects')
            .select('*')
            .ilike('name', `%${query}%`)
            .is('deleted_at', null);
        return from(promise).pipe(
            map((response) => {
                return response.data ?? [];
            }),
        );
    }
}
