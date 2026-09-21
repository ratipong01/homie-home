import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://llveuldmjvaewpngkxbm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdmV1bGRtanZhZXdwbmdreGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NzQ5NzQsImV4cCI6MjEwNTU1MDk3NH0.O6lHV_HtGyPh36TcLA1EKbCtj3geK4YaZ2SPqaljku8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
