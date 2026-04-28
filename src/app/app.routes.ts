import { Routes } from '@angular/router';
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
        loadChildren: () => import('@projects/project.routes').then((m) => m.projectRoutes),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
