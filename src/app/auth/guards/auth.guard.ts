import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthFacade } from '@auth/facades/auth.facade';

export const authGuard: CanActivateFn = (route, _state) => {
    const authFacade = inject(AuthFacade);
    const router = inject(Router);

    return authFacade.loading$.pipe(
        filter((loading) => !loading),
        take(1),
        map((loading) => {
            if (loading) {
                return false;
            }

            const isAuthenticated = authFacade['user$'].value !== null;

            if (!isAuthenticated) {
                router.navigate(['/']);
                return false;
            }

            return true;
        }),
    );
};
