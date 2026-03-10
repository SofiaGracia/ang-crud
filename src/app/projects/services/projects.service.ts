import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Project } from '../interfaces/project-response.interface';

const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class ProjectsService {
    private http = inject(HttpClient);

    // Valorar poner opciones
    getProjects(): Observable<Project[]> {
        return this.http
            .get<Project[]>(`${baseUrl}/projects`, {})
            .pipe(tap((resp) => console.log(resp)));
    }
}
