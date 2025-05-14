import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        '/save-game': {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
      },
      watch: {
        usePolling: true,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      coverage: {
        reporter: ['text', 'html'], 
        reportsDirectory: './coverage',
        exclude: [
          'eslint.config.*',
          'vite.config.*',
          '**/*.d.ts',
          'node_modules/',
          'tests/',
          '**/*.test.*',
          'coverage/',
          'dist/'
        ],
      },
    },
  });
};