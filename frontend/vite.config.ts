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
  // ── Build optimizado ────────────────────────────────────────────────────────
  build: {
    // Minifica con esbuild (default) y elimina console.* / debugger en prod.
    // Cada console.log que sobrevive cuesta CPU al motor, ocupa bytes en el
    // bundle, y se queda en memoria mientras DevTools esté abierto.
    minify: 'esbuild',
    // Genera sourcemaps "hidden" para que Sentry pueda reportar errores legibles
    // sin exponer los .map al navegador.
    sourcemap: 'hidden',
    // Inline assets <4kB para reducir requests HTTP.
    assetsInlineLimit: 4096,
    // Hash en filenames → permite cache-busting agresivo del CDN.
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  esbuild: {
    // Eliminar console.* y debugger en producción.
    // En dev se conservan para debugging.
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Mantener `console.error` / `console.warn` SI la app reporta errores reales.
    // Si quieres que también se eliminen, cámbialo a ['console','debugger'].
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
      // En desarrollo: /api → proxy local en puerto 3001
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        ws:           true,   // también proxea WebSockets
      },
    },
  },
})
