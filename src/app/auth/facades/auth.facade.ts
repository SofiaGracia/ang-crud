import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Session, User } from '@supabase/supabase-js';
import { AuthSupabaseService } from '../services/authSupabase.service';

@Injectable({ providedIn: 'root' })
export class AuthFacade implements OnDestroy {
    private authService = inject(AuthSupabaseService);

    private user$ = new BehaviorSubject<User | null>(null);
    private session$ = new BehaviorSubject<Session | null>(null);
    private isLoading$ = new BehaviorSubject<boolean>(true);

    constructor() {
        this.initAuthState();
    }

    private async initAuthState(): Promise<void> {
        const session = await this.authService.getSession();
        if (session) {
            this.session$.next(session);
            this.user$.next(session.user);
        }
        this.isLoading$.next(false);

        this.authService.onAuthStateChange((_event, session) => {
            this.session$.next(session);
            this.user$.next(session?.user ?? null);
        });
    }

    get currentUser$(): Observable<User | null> {
        return this.user$.asObservable();
    }

    get currentSession$(): Observable<Session | null> {
        return this.session$.asObservable();
    }

    get isAuthenticated$(): Observable<boolean> {
        return this.user$.pipe(map((user) => user !== null));
    }

    get loading$(): Observable<boolean> {
        return this.isLoading$.asObservable();
    }

    async signInWithGoogle(): Promise<void> {
        const { error } = await this.authService.signInWithGoogle();
        if (error) {
            console.error('Google sign in error:', error);
        }
    }

    async signInWithGithub(): Promise<void> {
        const { error } = await this.authService.signInWithGithub();
        if (error) {
            console.error('GitHub sign in error:', error);
        }
    }

    async signInWithPassword(email: string, password: string): Promise<void> {
        const { error } = await this.authService.signInWithPassword(email, password);
        if (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    async signUp(email: string, password: string): Promise<{ error: any }> {
        const result = await this.authService.signUp(email, password);
        if (result.error) {
            console.error('Sign up error:', result.error);
        }
        return result;
    }

    async signOut(): Promise<void> {
        const { error } = await this.authService.signOut();
        if (error) {
            console.error('Sign out error:', error);
        }
    }

    ngOnDestroy(): void {
        this.user$.complete();
        this.session$.complete();
        this.isLoading$.complete();
    }
}
