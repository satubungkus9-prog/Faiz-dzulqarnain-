import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const wagmiShimPath = path.resolve(__dirname, './src/shims/wagmi-shim.ts');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'wagmi-v3-balance-compat',
        enforce: 'pre',
        resolveId(source, importer) {
          if (
            source === 'wagmi' &&
            importer &&
            !importer.includes('wagmi-shim') &&
            !importer.includes('node_modules')
          ) {
            return wagmiShimPath;
          }
          return null;
        },
      },
      {
        name: 'tonconnect-manifest-endpoint',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.split('?')[0] === '/tonconnect-manifest.json') {
              const host = req.headers.host ?? 'localhost:3000';
              const forwardedProto = req.headers['x-forwarded-proto'];
              const protoHeader = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
              const protocol = protoHeader ?? (host.startsWith('localhost') ? 'http' : 'https');
              const origin = `${protocol}://${host}`;

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cache-Control', 'no-store');
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  url: origin,
                  name: 'Wallet Login',
                  iconUrl: `${origin}/wallet-icon.png`,
                })
              );
              return;
            }
            next();
          });
        },
      },
    ],
    define: {
      'process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID': JSON.stringify(
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''
      ),
      'process.env.NEXT_PUBLIC_PROJECT_ID': JSON.stringify(
        process.env.NEXT_PUBLIC_PROJECT_ID ?? ''
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'next/navigation': path.resolve(__dirname, './src/shims/next-navigation.ts'),
        'cross-fetch/polyfill': path.resolve(__dirname, './src/shims/cross-fetch-shim.ts'),
        'cross-fetch': path.resolve(__dirname, './src/shims/cross-fetch-shim.ts'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
