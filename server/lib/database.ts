// Server-side Supabase client for background jobs
// Uses service_role key for admin access (bypasses RLS)

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
// Try to load from project root first, then from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

// Load .env from project root (where Vite expects it)
dotenv.config({ path: join(projectRoot, '.env') });
// Also try server/.env as fallback
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required');
}

if (!supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set. Background jobs may fail due to RLS policies.');
  console.warn('   Get your service_role key from Supabase Dashboard → Settings → API');
}

// Create admin client with service_role key (bypasses RLS)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database helper functions
export const db = {
  async getActiveInitiatives() {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Set SUPABASE_SERVICE_ROLE_KEY.');
    }

    const { data, error } = await supabaseAdmin
      .from('initiatives')
      .select('*')
      .in('status', ['active', 'published'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active initiatives: ${error.message}`);
    }

    return data || [];
  },

  async updateInitiativeSnapshots(initiativeId: string, snapshots: any[]) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Set SUPABASE_SERVICE_ROLE_KEY.');
    }

    const { error } = await supabaseAdmin
      .from('initiatives')
      .update({ satellite_snapshots: snapshots })
      .eq('id', initiativeId);

    if (error) {
      throw new Error(`Failed to update snapshots for initiative ${initiativeId}: ${error.message}`);
    }
  },

  async getInitiativeById(initiativeId: string) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Set SUPABASE_SERVICE_ROLE_KEY.');
    }

    const { data, error } = await supabaseAdmin
      .from('initiatives')
      .select('*')
      .eq('id', initiativeId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch initiative ${initiativeId}: ${error.message}`);
    }

    return data;
  }
};

