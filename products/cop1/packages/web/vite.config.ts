import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The cop1 daemon's default port (DEFAULT_PORT in @cop1/app DaemonState). The dev
// server proxies /api + /events here. Override with VITE_DAEMON_PORT when the
// daemon runs on a non-default port (e.g. `cop1 start --port 5000`).
const daemonPort = process.env.VITE_DAEMON_PORT ?? '4242';
const daemonTarget = `http://localhost:${daemonPort}`;

export default defineConfig({
  plugins: [react()],
  server: {
    // Respecte le port assigné (PORT — ex. preview autoPort) ; 5173 par défaut en dev direct.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    proxy: {
      '/api': {
        target: daemonTarget,
        changeOrigin: true,
      },
      '/events': {
        target: daemonTarget,
        changeOrigin: true,
      },
    },
  },
});
