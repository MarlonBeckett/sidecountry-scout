import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserPreferences = {
  id: string;
  user_id: string;
  selected_center: string | null;
  selected_zone: string | null;
  created_at: string;
  updated_at: string;
};
