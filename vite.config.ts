import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pitchApiProxy } from './server/pitchapi-vite';

export default defineConfig({
  base: './',
  plugins: [react(), pitchApiProxy(), {
    name: 'local-gauntlet-page',
    configureServer(server) {
      // Match the directory-index routing used by GitHub Pages. Otherwise
      // Vite's SPA fallback opens the studio home instead of the static game.
      server.middlewares.use((request, _response, next) => {
        if (request.url?.split('?')[0] === '/stretfordgauntlet/') {
          request.url = request.url.replace('/stretfordgauntlet/', '/stretfordgauntlet/index.html');
        }
        next();
      });
    },
  }],
});
