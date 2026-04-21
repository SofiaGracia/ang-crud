import { Routes } from '@angular/router';
import { Projects } from '@projects/components/projects/projects';
import { Prototypes } from '@prototypes/components/prototypes/prototypes';
import { Prototype } from '@prototypes/components/prototype/prototype';
import { RecentPrototypes } from '@web-front/components/recent-prototypes/recent-prototypes';
import { Trash } from '@web-front/components/trash/trash';
import { authGuard } from '@auth/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./auth/pages/login/login'),
    },
    {
        path: 'register',
        loadComponent: () => import('./auth/pages/register/register'),
    },
    {
        path: 'auth/callback',
        loadComponent: () => import('./auth/pages/auth-callback/auth-callback'),
    },
    {
        path: '',
        loadComponent: () => import('./web-front/pages/landing/landing'),
    },
    {
        path: 'projects',
        loadComponent: () => import('./web-front/layouts/web-front-layout/web-front-layout'),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                component: Projects,
            },
            {
                path: 'recent',
                component: RecentPrototypes,
            },
            {
                path: 'trash',
                component: Trash,
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
                        component: Prototypes,
                    },
                    {
                        path: 'prototypes/:prototypeId',
                        component: Prototype,
                    },
                ],
            },
            {
                path: '**',
                redirectTo: '',
            },
        ],
    },
    {
        path: '**',
        redirectTo: '',
    },
];
