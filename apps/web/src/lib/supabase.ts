import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Supabase configuration
// These will be replaced with environment variables when the project is built
const supabaseUrl = 'https://neqdtnmffgagkjmerukb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcWR0bm1mZmdhZ2tqbWVydWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTM5ODIsImV4cCI6MjA4NjIyOTk4Mn0.on7-RuBF4kUcBBHrPamdM54t3J62CGjQegRx7ekjzZ4';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Re-export types for convenience
export type { Database };
