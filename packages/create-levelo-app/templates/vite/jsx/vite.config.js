// vite.config.js - Vite Configuration for Levelo JS Test Environment
import { defineConfig } from 'vite';
import { leveloPlugin } from 'vite-plugin-levelojs';

export default defineConfig({
  plugins: [leveloPlugin()],
  server: {
    port: 6262,
  },
});
