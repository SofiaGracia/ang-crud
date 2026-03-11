import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProjectInterface } from '../interfaces/project.interface';

const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class ProjectsService {
    private http = inject(HttpClient);

    // Valorar poner opciones
    getProjects(): Observable<ProjectInterface[]> {
        return this.http
            .get<ProjectInterface[]>(`${baseUrl}/projects`, {})
            .pipe(tap((resp) => console.log(resp)));
    }
}
