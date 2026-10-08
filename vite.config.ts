import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          // Content Security Policy - Relaxed for dev
          res.setHeader(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai",
              "img-src 'self' data: https:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
            ].join('; ')
          );
          // Prevent clickjacking
          res.setHeader('X-Frame-Options', 'DENY');
          // Prevent MIME sniffing
          res.setHeader('X-Content-Type-Options', 'nosniff');
          // Enable XSS protection
          res.setHeader('X-XSS-Protection', '1; mode=block');
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Dev-only RPC proxy: keeps Solana RPC calls same-origin so the
      // connect-src 'self' CSP above doesn't block the local validator.
      // Use VITE_RPC_URL=/rpc when developing against a local validator.
      '/rpc': {
        target: process.env.VITE_RPC_TARGET || 'http://127.0.0.1:18999',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/rpc/, ''),
      },
    },
  },
  preview: {
    port: 5001,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: isSsrBuild ? undefined : {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
