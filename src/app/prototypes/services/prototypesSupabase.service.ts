import { Injectable, inject } from '@angular/core';
import { PrototypeInterface } from '@prototypes/interfaces/prototype.interface';
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

    getProtoByName(name: string): Observable<PrototypeInterface | null> {
        const promise = this.supabase.from('prototypes').select('*').eq('name', name).maybeSingle();
        return from(promise).pipe(map((response) => response.data));
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
}
