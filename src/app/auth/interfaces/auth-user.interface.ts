import { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
    user_metadata: {
        name?: string;
        full_name?: string;
        avatar_url?: string;
        email?: string;
        provider?: string;
    };
}
