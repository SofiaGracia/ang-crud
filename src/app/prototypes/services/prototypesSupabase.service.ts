import { Injectable, inject } from '@angular/core';
import { Prototype, PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { map, Observable, from, forkJoin } from 'rxjs';
import { SupabaseClientService } from '@shared/services/supabase-client.service';
import { PaginatedResponse } from '@shared/interfaces/paginated-response.interface';

@Injectable({ providedIn: 'root' })
export class PrototypesSupabaseService {
    private supabase = inject(SupabaseClientService).instance;

    getPrototypesByProject(projectId: number): Observable<PrototypeInterface[]> {
        const promise = this.supabase
            .from('prototypes')
            .select('*')
            .eq('project_id', projectId)
            .is('deleted_at', null);

        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return response.data ?? [];
            }),
        );
    }

    getPrototypesPaginated(
        projectId: number,
        page: number,
        limit: number = 8,
    ): Observable<PaginatedResponse<PrototypeInterface>> {
        const fromIndex = (page - 1) * limit;
        const toIndex = fromIndex + limit - 1;

        const countPromise = this.supabase
            .from('prototypes')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .is('deleted_at', null);

        const dataPromise = this.supabase
            .from('prototypes')
            .select('*')
            .eq('project_id', projectId)
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

    getFirstPrototypesByProject(projectId: number, limit: number): Observable<PrototypeInterface[]> {
        const promise = this.supabase
            .from('prototypes')
            .select('*')
            .eq('project_id', projectId)
            .is('deleted_at', null)
            .limit(limit);

        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return response.data ?? [];
            }),
        );
    }

    // Deuria comprovar-se per mateix nom i mateix projecte
    getProtoByName(name: string): Observable<PrototypeInterface | null> {
        const promise = this.supabase.from('prototypes').select('*').eq('name', name).maybeSingle();
        return from(promise).pipe(map((response) => response.data));
    }

    getPrototypeById(projectId: number, prototypeId: number): Observable<PrototypeInterface | null> {
        const promise = this.supabase
            .from('prototypes')
            .select('*')
            .eq('project_id', projectId)
            .eq('id', prototypeId)
            .maybeSingle();

        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return response.data;
            }),
        );
    }

    moveToTrash(protoId: number): Observable<void> {
        const promise = this.supabase
            .from('prototypes')
            .update({ deleted_at: new Date().toISOString() } as any)
            .eq('id', protoId);
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return;
            }),
        );
    }

    getTrashedPrototypes(): Observable<PrototypeInterface[]> {
        const promise = this.supabase
            .from('prototypes')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });
        return from(promise).pipe(
            map((response) => {
                return response.data ?? [];
            }),
        );
    }

    restorePrototype(protoId: number): Observable<void> {
        const promise = this.supabase
            .from('prototypes')
            .update({ deleted_at: null } as any)
            .eq('id', protoId);
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return;
            }),
        );
    }

    permanentDeletePrototype(protoId: number): Observable<void> {
        const promise = this.supabase.from('prototypes').delete().eq('id', protoId);
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return;
            }),
        );
    }

    async uploadPrototypeFile(file: File, projectId: number): Promise<string> {
        const filePath = `${projectId}/${Date.now()}.html`;
        const response = await this.supabase.storage.from('prototypes').upload(filePath, file, {
            contentType: 'text/html',
            upsert: false,
        });

        if (response.error) {
            throw response.error;
        }

        const { data: publicUrlData } = this.supabase.storage
            .from('prototypes')
            .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
            throw new Error('Could not get public URL');
        }

        return publicUrlData.publicUrl;
    }

    addPrototype(prototype: Prototype): Observable<PrototypeInterface> {
        const promise = this.supabase.from('prototypes').insert(prototype).select('*').single();
        return from(promise).pipe(
            map((response) => {
                if (response.error) {
                    throw response.error;
                }
                return response.data;
            }),
        );
    }

    searchPrototypesByName(query: string): Observable<PrototypeInterface[] | null> {
        const promise = this.supabase
            .from('prototypes')
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
