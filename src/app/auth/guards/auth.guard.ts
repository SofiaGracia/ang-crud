import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthFacade } from '@auth/facades/auth.facade';

export const authGuard: CanActivateFn = (_route, _state) => {
    const authFacade = inject(AuthFacade);
    const router = inject(Router);

    return authFacade.loading$.pipe(
        filter((loading) => !loading),
        take(1),
        switchMap(() => authFacade.isAuthenticated$.pipe(take(1))),
        map((isAuthenticated) => {
            if (!isAuthenticated) {
                router.navigate(['/']);
                return false;
            }

            return true;
        }),
    );
};
