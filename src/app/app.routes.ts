import { Routes } from '@angular/router';
import { Projects } from '@projects/components/projects/projects';
import { Prototypes } from '@prototypes/prototypes/prototypes';
import { Prototype } from '@prototypes/prototype/prototype';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./web-front/layouts/web-front-layout/web-front-layout'),
        children: [
            {
                path: '',
                redirectTo: 'projects',
                pathMatch: 'full',
            },
            {
                path: 'projects',
                children: [
                    {
                        path: '',
                        // Listado de proyectos
                        component: Projects,
                    },
                    {
                        path: ':projectId',
                        children: [
                            {
                                path: '',
                                redirectTo: 'prototypes',
                                pathMatch: 'full',
                            },
                            {
                                path: 'prototypes',
                                // Listado de prototipos de un proyecto
                                component: Prototypes,
                            },
                            {
                                path: 'prototypes/:prototypeId',
                                // Detalle de un prototipo concreto (opcional)
                                component: Prototype
                            },
                        ],
                    },
                ],
            },
            {
                path: '**',
                redirectTo: 'projects'
            },
        ],
    },
];
