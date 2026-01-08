/**
 * Supabase Client Configuration
 * Provides both client-side (anon) and server-side (service role) clients
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.NEXT_SECRET_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client-side Supabase client (respects RLS)
 * Use this in components and client-side code
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client with service role (bypasses RLS)
 * Use this in API routes for caching and admin operations
 */
export function getServiceClient() {
  if (!supabaseServiceKey) {
    console.warn('Service role key not found, falling back to anon key');
    return supabase;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Export types
export type { UserPreferences } from '@/types';
