import { Routes } from '@angular/router';

export const projectRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                loadComponent: () => import('@projects/components/projects/projects').then((m) => m.Projects),
            },
            {
                path: 'recent',
                loadComponent: () => import('@web-front/components/recent-prototypes/recent-prototypes').then((m) => m.RecentPrototypes),
            },
            {
                path: 'trash',
                loadComponent: () => import('@web-front/components/trash/trash').then((m) => m.Trash),
            },
            {
                path: ':projectId',
                loadChildren: () => import('@prototypes/prototypes.routes').then((m) => m.prototypesRoutes)
            },
            {
                path: '**',
                redirectTo: '',
            },
        ],
    },
];
