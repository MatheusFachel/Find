import { createClient } from '@supabase/supabase-js';

// Verificação para garantir que as variáveis de ambiente estão definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas!', { 
    url: supabaseUrl ? 'OK' : 'AUSENTE', 
    key: supabaseAnonKey ? 'OK' : 'AUSENTE' 
  });
}

export const supabase = createClient(
  supabaseUrl as string || 'https://uxpevrzxtaszjkedzobi.supabase.co',
  supabaseAnonKey as string || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cGV2cnp4dGFzemprZWR6b2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDcwOTgsImV4cCI6MjA3NDY4MzA5OH0.uIQTIfQCsd6tT8pJeEEuC2tIcvhk6-bgsZ9_qCPa69w'
);
