import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@projects/types/datatypes.types';
import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly client: SupabaseClient<Database>;

  constructor() {
    this.client = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
        },
      }
    );
  }

  get instance(): SupabaseClient<Database> {
    return this.client;
  }
}
