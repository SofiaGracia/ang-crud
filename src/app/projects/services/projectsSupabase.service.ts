import { Injectable, inject } from '@angular/core';
import { Observable, from, map, forkJoin } from 'rxjs';
import { Project, ProjectInterface } from '@projects/interfaces/project.interface';
import { SupabaseClientService } from '@shared/services/supabase-client.service';
import { PaginatedResponse } from '@shared/interfaces/paginated-response.interface';

@Injectable({ providedIn: 'root' })
export class ProjectSupabaseService {
    private supabase = inject(SupabaseClientService).instance;

    getProjects(userId: string): Observable<ProjectInterface[]> {
        const promise = this.supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null);
        return from(promise).pipe(
            map((response) => {
                return response.data ?? [];
            }),
        );
    }

    getProjectsPaginated(
        userId: string,
        page: number,
        limit: number = 8,
    ): Observable<PaginatedResponse<ProjectInterface>> {
        const fromIndex = (page - 1) * limit;
        const toIndex = fromIndex + limit - 1;

        const countPromise = this.supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('deleted_at', null);

        const dataPromise = this.supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
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

    getProjectByName(name: string, userId: string): Observable<ProjectInterface | null> {
        const promise = this.supabase
            .from('projects')
            .select('*')
            .eq('name', name)
            .eq('user_id', userId)
            .maybeSingle();
        return from(promise).pipe(map((response) => response.data));
    }

    getProjectById(id: number, userId: string): Observable<ProjectInterface | null> {
        const promise = this.supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();
        return from(promise).pipe(map((response) => response.data));
    }

    addProject(project: Project, userId: string): Observable<ProjectInterface> {
        const projectWithUser = { ...project, user_id: userId };
        const promise = this.supabase.from('projects').insert(projectWithUser).select('*').single();
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

    getTrashedProjects(userId: string): Observable<ProjectInterface[]> {
        const promise = this.supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
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

    searchProjectsByName(query: string, userId: string): Observable<ProjectInterface[] | null> {
        const promise = this.supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .ilike('name', `%${query}%`)
            .is('deleted_at', null);
        return from(promise).pipe(
            map((response) => {
                return response.data ?? [];
            }),
        );
    }
}
