import { Injectable, inject } from '@angular/core';
import { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseClientService } from '@shared/services/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class AuthSupabaseService {
    private supabaseClient = inject(SupabaseClientService);
    private readonly supabase: SupabaseClient = this.supabaseClient.instance;
    private readonly auth = this.supabase.auth;

    async signInWithGoogle(): Promise<{ error: Error | null }> {
        const { error } = await this.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { error };
    }

    async signInWithGithub(): Promise<{ error: Error | null }> {
        const { error } = await this.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { error };
    }

    async signInWithPassword(email: string, password: string): Promise<{ error: Error | null }> {
        const { error } = await this.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    }

    async signUp(email: string, password: string): Promise<{ error: Error | null }> {
        const { error } = await this.auth.signUp({
            email,
            password,
        });
        return { error };
    }

    async signOut(): Promise<{ error: Error | null }> {
        const { error } = await this.auth.signOut();
        return { error };
    }

    async getSession(): Promise<Session | null> {
        const { data } = await this.auth.getSession();
        return data.session;
    }

    async getUser(): Promise<User | null> {
        const { data } = await this.auth.getUser();
        return data.user;
    }

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return this.auth.onAuthStateChange(callback);
    }
}
