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
  build: {
    minify: 'esbuild',
    // Mapas generados pero sin referencia en el bundle: no se exponen al navegador.
    sourcemap: 'hidden',
    assetsInlineLimit: 4096,
    // Hash en los nombres para poder cachear agresivamente en el CDN.
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  esbuild: {
    // En producción se quitan los logs de depuración (`pure`) pero se conservan
    // console.error y console.warn: son la única pista cuando algo falla en un
    // teléfono de un tester.
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    pure: ['console.log', 'console.debug', 'console.info', 'console.trace'],
  },
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
      // En desarrollo, /api va al proxy local.
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        ws:           true,   // la voz usa WebSocket en /api/live
      },
    },
  },
})
