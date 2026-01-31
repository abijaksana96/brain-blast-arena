import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 30002,
      host: '0.0.0.0',
      // Allow Serveo / serveousercontent hosts so tunneled requests aren't blocked
      // Add the exact host reported by Serveo if needed; wildcard covers subdomains.
      allowedHosts: [
        'c5acf3d45f7980bb-114-79-37-239.serveousercontent.com',
        '.serveousercontent.com',
        'localhost'
      ],
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
