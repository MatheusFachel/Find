import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Adiciona logs para verificar se as variáveis de ambiente estão carregando
console.log('Variáveis de ambiente:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Definida' : 'Não definida',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Definida' : 'Não definida'
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
