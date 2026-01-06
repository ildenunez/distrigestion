
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjwncrzykueskpxfykfi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqd25jcnp5a3Vlc2tweGZ5a2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NDYwNTIsImV4cCI6MjA4MzIyMjA1Mn0.dLoG3lLdCNATu_PP1oBg1LC93WlsUgRjviG1RXA-naE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
