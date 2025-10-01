import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dotenvExpand from 'dotenv-expand';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega env files
  const env = loadEnv(mode, process.cwd(), '');
  dotenvExpand.expand({ parsed: env });

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      // Disponibiliza as variáveis para o cliente
      'process.env': env
    },
    server: {
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
