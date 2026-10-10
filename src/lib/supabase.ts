import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SUPABASE_URL: 'skd_supabase_url',
  SUPABASE_ANON_KEY: 'skd_supabase_anon_key'
};

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '' : '';
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) || '' : '';

  const url = customUrl.trim() || envUrl.trim();
  const anonKey = customKey.trim() || envKey.trim();

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('placeholder') &&
    !url.includes('your-project-ref') &&
    url.startsWith('http')
  );

  return { url, anonKey, isConfigured, isCustom: Boolean(customUrl && customKey) };
};

let clientInstance: SupabaseClient | null = null;
let currentClientKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const key = `${url}_${anonKey}`;
  if (!clientInstance || currentClientKey !== key) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      currentClientKey = key;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

export const saveSupabaseCredentials = (url: string, anonKey: string): boolean => {
  try {
    if (!url.trim() || !anonKey.trim()) {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
      clientInstance = null;
      currentClientKey = '';
      return true;
    }

    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
    clientInstance = null;
    currentClientKey = '';
    return true;
  } catch (err) {
    console.error('Failed to save Supabase credentials:', err);
    return false;
  }
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string; latencyMs?: number }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  const start = Date.now();
  try {
    const { error } = await client.from('customers').select('id').limit(1);
    const latencyMs = Date.now() - start;
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, latencyMs };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Connection timeout' };
  }
};

// Default export for backwards compatibility
export const supabase = getSupabaseClient();
