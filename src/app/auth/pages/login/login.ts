import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AuthFacade } from '@auth/facades/auth.facade';

@Component({
    selector: 'app-login',
    imports: [FormsModule, FaIconComponent],
    templateUrl: './login.html',
    styles: `
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    `,
})
export default class Login {
    private authFacade = inject(AuthFacade);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    faEnvelope = faEnvelope;
    faLock = faLock;
    faSpinner = faSpinner;

    email = '';
    password = '';
    errorMessage = '';
    isLoading = false;
    isLoadingOAuth = false;

    async signInWithGoogle(): Promise<void> {
        this.isLoadingOAuth = true;
        await this.authFacade.signInWithGoogle();
    }

    async signInWithGithub(): Promise<void> {
        this.isLoadingOAuth = true;
        await this.authFacade.signInWithGithub();
    }

    async signInWithEmail(): Promise<void> {
        if (!this.email || !this.password) {
            this.errorMessage = 'Please enter email and password';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        try {
            await this.authFacade.signInWithPassword(this.email, this.password);
            this.navigateAfterLogin();
        } catch (_error) {
            this.errorMessage = 'Invalid email or password';
        } finally {
            this.isLoading = false;
        }
    }

    private navigateAfterLogin(): void {
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        const destination = redirect ? decodeURIComponent(redirect) : '/projects';
        this.router.navigateByUrl(destination);
    }
}
