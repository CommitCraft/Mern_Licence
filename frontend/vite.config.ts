import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from the project root directory
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const localEnv = loadEnv(mode, __dirname, '');
  const env = { ...rootEnv, ...localEnv };

  const host = env.FRONTEND_HOST || env.VITE_HOST || '0.0.0.0';
  const port = parseInt(env.FRONTEND_PORT || env.VITE_PORT || '3000', 10);

  const backendHost = env.BACKEND_HOST || env.HOST || 'localhost';
  const backendPort = env.BACKEND_PORT || env.PORT || '8000';
  const targetHost = backendHost === '0.0.0.0' ? 'localhost' : backendHost;

  const apiTarget = env.VITE_API_BASE_URL
    ? env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : `http://${targetHost}:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      host: host,
      port: port,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
