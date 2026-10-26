import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from Vite environment or localStorage override
export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  const localUrl = (typeof localStorage !== 'undefined' && localStorage.getItem('freshprice_supabase_url')) || '';
  const localKey = (typeof localStorage !== 'undefined' && localStorage.getItem('freshprice_supabase_anon_key')) || '';

  const url = (localUrl || envUrl).trim();
  const key = (localKey || envKey).trim();

  // Supabase URL should look like https://*.supabase.co
  const isConfigured = Boolean(url && key && url.startsWith('http'));

  return { url, key, isConfigured };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      supabaseInstance = null;
    }
  }

  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !key) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }
    const testClient = createClient(url, key);
    const { error } = await testClient.from('categories').select('count', { count: 'exact', head: true });
    
    if (error) {
      // If table doesn't exist yet, it's connected to Supabase but needs migrations
      if (error.code === '42P01') {
        return { success: true, message: 'Connected to Supabase! (Note: database schema/tables need to be created via migration SQL).' };
      }
      return { success: false, message: `Supabase error: ${error.message}` };
    }
    
    return { success: true, message: 'Supabase connection successful and verified!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Connection failed: ${msg}` };
  }
}
