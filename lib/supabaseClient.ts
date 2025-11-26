import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables in Vite
// We check both process.env (if polyfilled) and import.meta.env (Vite standard)
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Cast import.meta to any to fix TS error "Property 'env' does not exist on type 'ImportMeta'"
  if (import.meta && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Only create the client if keys are present, otherwise return null
// This prevents the app from crashing with "Error: supabaseUrl is required"
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.log("Supabase niet geconfigureerd. App draait in offline/lokale modus.");
}