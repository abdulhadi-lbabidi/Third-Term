import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import dns from 'dns';
import fs from 'fs';

dns.setDefaultResultOrder('ipv4first');

// https://vitejs.dev/config/
export default defineConfig({
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
    host: "finance-nouh.sy",
    port: 443,
    https: {
      key: fs.readFileSync("./certificate/finance-nouh.sy-key.pem"),
      cert: fs.readFileSync("./certificate/finance-nouh.sy.pem"),
    },
  },
});
