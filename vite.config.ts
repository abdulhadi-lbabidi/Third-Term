import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import dns from 'dns';
import fs from 'fs';

dns.setDefaultResultOrder('ipv4first');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isAiqot = env.VITE_API_DEV === 'aiqot';

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: isAiqot ? 'finance-nouh.sy' : '0.0.0.0',
      port: isAiqot ? 443 : 5173,
      https: isAiqot && fs.existsSync('./certificate/finance-nouh.sy-key.pem') && fs.existsSync('./certificate/finance-nouh.sy.pem')
        ? {
          key: fs.readFileSync('./certificate/finance-nouh.sy-key.pem'),
          cert: fs.readFileSync('./certificate/finance-nouh.sy.pem'),
        }
        : undefined,
      proxy: {
        '/file-proxy': {
          target: 'https://nouh-finance-api.nouh-agency.com',
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) => requestPath.replace(/^\/file-proxy/, ''),
        },
      },
    },
  };
});
