import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { FrontSidebar } from '@web-front/components/front-sidebar/front-sidebar';
import { AuthFacade } from '@auth/facades/auth.facade';

@Component({
    selector: 'app-web-front-layout',
    imports: [RouterOutlet, AsyncPipe, FrontSidebar],
    templateUrl: './web-front-layout.html',
    styles: `
        .layout {
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        .content {
            flex: 1;
            padding: 2rem;
            height: 100%;
            overflow-y: auto;
        }
    `,
})
export default class WebFrontLayout {
    private authFacade = inject(AuthFacade);
    private router = inject(Router);

    isAuthenticated$ = this.authFacade.isAuthenticated$;

    async signOut(): Promise<void> {
        await this.authFacade.signOut();
        this.router.navigate(['/']);
    }
}
