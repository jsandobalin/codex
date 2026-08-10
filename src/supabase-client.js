import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3';
import { getSupabaseConfig } from './config.js';

const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig() || {};

export const supabase = supabaseUrl ? createClient(supabaseUrl, supabasePublishableKey) : null;
