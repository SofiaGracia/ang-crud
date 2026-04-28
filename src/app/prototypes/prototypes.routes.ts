import { Routes } from '@angular/router';

export const prototypesRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                redirectTo: 'prototypes',
                pathMatch: 'full',
            },
            {
                path: 'prototypes',
                loadComponent: () =>
                    import('@prototypes/components/prototypes/prototypes').then(
                        (m) => m.Prototypes,
                    ),
            },
            {
                path: 'prototypes/:prototypeId',
                loadComponent: () =>
                    import('@prototypes/components/prototype/prototype').then((m) => m.Prototype),
            },
        ],
    },
];
