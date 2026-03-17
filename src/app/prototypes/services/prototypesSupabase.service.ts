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
}
