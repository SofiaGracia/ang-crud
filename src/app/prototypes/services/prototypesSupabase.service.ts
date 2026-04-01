import { Injectable, inject } from '@angular/core';
import { Prototype, PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
import { map, Observable, from } from 'rxjs';
import { SupabaseClientService } from '@shared/services/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class PrototypesSupabaseService {
    private supabase = inject(SupabaseClientService).instance;

    getPrototypesByProject(projectId: number): Observable<PrototypeInterface[]> {
        const promise = this.supabase.from('prototypes').select('*').eq('project_id', projectId);

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

    removeProto(protoId: number): Observable<void> {
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
}
