import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@projects/types/datatypes.types';
import { environment } from 'src/environments/environment';

export abstract class SupabaseBaseService {
  protected supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }
}
