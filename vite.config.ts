import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build`               -> dist/       (real client, talks to the Socket.IO server)
// `vite build --mode demo`   -> dist-demo/  (one self-contained HTML file; the game runs in the browser)
export default defineConfig(({ mode }) => ({
  root: 'client',
  plugins: [react(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  define: { __DEMO__: JSON.stringify(mode === 'demo') },
  build: { outDir: mode === 'demo' ? '../dist-demo' : '../dist', emptyOutDir: true },
  server: {
    fs: { allow: ['..'] },
    proxy: { '/socket.io': { target: 'http://localhost:3000', ws: true } },
  },
}));
