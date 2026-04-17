import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faLock, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';
import { AuthFacade } from '@auth/facades/auth.facade';

@Component({
    selector: 'app-register',
    imports: [FormsModule, FaIconComponent, RouterLink],
    templateUrl: './register.html',
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
export default class Register {
    private authFacade = inject(AuthFacade);
    private router = inject(Router);

    faEnvelope = faEnvelope;
    faLock = faLock;
    faSpinner = faSpinner;
    faCheck = faCheck;

    email = '';
    password = '';
    confirmPassword = '';
    errorMessage = '';
    successMessage = '';
    isLoading = signal(false);

    async signUp(): Promise<void> {
        this.errorMessage = '';
        this.successMessage = '';

        if (!this.email || !this.password || !this.confirmPassword) {
            this.errorMessage = 'Please fill in all fields';
            return;
        }

        if (!this.isValidEmail(this.email)) {
            this.errorMessage = 'Please enter a valid email address';
            return;
        }

        if (this.password.length < 6) {
            this.errorMessage = 'Password must be at least 6 characters';
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.errorMessage = 'Passwords do not match';
            return;
        }

        this.isLoading.set(true);

        try {
            const { available, message } = await this.authFacade.checkEmailAvailability(this.email);
            if (!available) {
                this.errorMessage = message || 'This email is already registered';
                this.isLoading.set(false);
                return;
            }

            const { error } = await this.authFacade.signUp(this.email, this.password);

            if (error) {
                this.handleSignUpError(error);
            } else {
                this.successMessage = 'Account created! Check your email to verify your account.';
                this.email = '';
                this.password = '';
                this.confirmPassword = '';
            }
        } catch (error: any) {
            this.handleSignUpError(error);
        } finally {
            this.isLoading.set(false);
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private handleSignUpError(error: any): void {
        const errorMessage = error?.message?.toLowerCase() || '';
        const errorCode = error?.code?.toLowerCase() || '';

        if (errorCode.includes('already_exists') || errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
            this.errorMessage = 'This email is already registered';
        } else if (errorCode.includes('invalid_email') || errorMessage.includes('invalid email')) {
            this.errorMessage = 'The email format is invalid';
        } else if (errorCode.includes('weak_password') || errorMessage.includes('password')) {
            this.errorMessage = 'Password must be at least 6 characters';
        } else if (errorMessage.includes('disabled') || errorMessage.includes('signup disabled')) {
            this.errorMessage = 'Registration is currently disabled';
        } else if (errorMessage.includes('rate')) {
            this.errorMessage = 'Too many attempts. Please try again later';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            this.errorMessage = 'Network error. Please check your connection';
        } else {
            this.errorMessage = 'Error creating account. Please try again';
        }
    }

    goToLogin(): void {
        this.router.navigate(['/login']);
    }
}
