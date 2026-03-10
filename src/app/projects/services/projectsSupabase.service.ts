import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { createClient } from '@supabase/supabase-js';
import { Observable } from 'rxjs';
import { Project } from '@projects/interfaces/project-response.interface';

const supabaseUrl = environment.supabaseUrl;
const supabaseKey = environment.supabaseKey;

@Injectable({providedIn: 'root'})
export class ProjectSupabaseService {
    supabase = createClient(
        supabaseUrl,
        supabaseKey
    )

    // getProjects(): Observable<Project[]> {
    //     return this.supabase.from('projects').select('*');
    // }
}
