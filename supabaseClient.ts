import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqkrwkmxvkerpepxqjbm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxa3J3a214dmtlcnBlcHhxamJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjMxNzQsImV4cCI6MjA4ODk5OTE3NH0.aZ00b4HUON_ACpYY4tKyT-bgnl3VdGLjpk38pSIjIZQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)