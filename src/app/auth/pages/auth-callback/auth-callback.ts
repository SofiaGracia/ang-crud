import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AuthFacade } from '@auth/facades/auth.facade';

@Component({
    selector: 'app-auth-callback',
    imports: [FaIconComponent],
    templateUrl: './auth-callback.html',
    styles: `
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
    `,
})
export default class AuthCallback implements OnInit {
    private authFacade = inject(AuthFacade);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    faSpinner = faSpinner;
    errorMessage = '';

    async ngOnInit(): Promise<void> {
        const code = this.route.snapshot.queryParamMap.get('code');
        const error = this.route.snapshot.queryParamMap.get('error');

        if (error) {
            this.errorMessage = `Authentication error: ${error}`;
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 3000);
            return;
        }

        if (code) {
            const redirect = this.route.snapshot.queryParamMap.get('redirect');
            const destination = redirect ? decodeURIComponent(redirect) : '/projects';

            setTimeout(() => {
                this.router.navigateByUrl(destination);
            }, 1000);
        } else {
            this.router.navigate(['/login']);
        }
    }
}
