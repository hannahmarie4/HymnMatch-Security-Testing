import { createClient } from '@supabase/supabase-js';

const isUrlValid = (u) => typeof u === 'string' && u.startsWith('https://') && !u.includes('placeholder') && !u.includes('your-');
const isKeyValid = (k) => typeof k === 'string' && k.startsWith('eyJhbGciOi') && k.length > 50;

const supabaseUrl = isUrlValid(import.meta.env.VITE_SUPABASE_URL)
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://nrhnrjivtadvnycftebt.supabase.co';

const supabaseAnonKey = isKeyValid(import.meta.env.VITE_SUPABASE_ANON_KEY)
  ? import.meta.env.VITE_SUPABASE_ANON_KEY 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yaG5yaml2dGFkdm55Y2Z0ZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzE4OTAsImV4cCI6MjA5NDQwNzg5MH0.VqgGgD5KOv7C3iHrZvTgzAPLiU343uJ0uC0vY7xg_zg';

console.log('[SupabaseClient] Initialized with:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 15) + '...' : 'none',
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  isEnvKeyValid: isKeyValid(import.meta.env.VITE_SUPABASE_ANON_KEY)
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

