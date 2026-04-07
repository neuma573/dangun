import { defineConfig } from 'vite';

export default defineConfig({
  // Set to your GitHub repo name for GitHub Pages deployment
  // e.g. if your Pages URL is https://neuma573.github.io/dangun/
  base: '/dangun/',

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
