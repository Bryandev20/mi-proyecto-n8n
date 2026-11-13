import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      
      // 👇 AGREGA ESTO PARA SOLUCIONAR EL CORS 👇
      proxy: {
        '/api-n8n': {
          target: 'http://localhost:5678',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-n8n/, ''),
        },
      },
      // 👆 FIN DEL PROXY 👆
    },
  };
});