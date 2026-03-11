import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { createClient } from '@supabase/supabase-js';
import { Observable, from, map } from 'rxjs';
import { ProjectInterface } from '@projects/interfaces/project.interface';
import { Database } from '@projects/types/datatypes.types';

const supabaseUrl = environment.supabaseUrl;
const supabaseKey = environment.supabaseKey;

@Injectable({ providedIn: 'root' })
export class ProjectSupabaseService {
    supabase = createClient<Database>(supabaseUrl, supabaseKey);

    getProjects(): Observable<ProjectInterface[]> {
        const promise = this.supabase.from('projects').select('*');
        return from(promise).pipe(
            map((response) => {
                return response.data ?? [];
            }),
        );
    }

    addProject(project: ProjectInterface): Observable<ProjectInterface> {
        const promise = this.supabase.from('projects').insert(project).select('*').single();
        return from(promise).pipe(map((response) => response.data!));
    }
}
