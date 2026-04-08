import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') return;
  console.error(err);
  process.exit(1);
});

const sslKeyPath  = path.resolve(__dirname, 'key.pem');
const sslCertPath = path.resolve(__dirname, 'cert.pem');
const hasSSL      = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    ...(hasSSL && {
      https: {
        key:  fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      },
    }),
    proxy: {
      // En desarrollo: /api → proxy local en puerto 3001
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        ws:           true,   // también proxea WebSockets
      },
    },
  },
})
