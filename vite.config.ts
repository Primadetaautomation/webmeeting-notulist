import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import EnvironmentPlugin from 'vite-plugin-environment';

export default defineConfig({
  plugins: [
    react(),
    // This explicitly exposes process.env.API_KEY to the client-side code
    EnvironmentPlugin(['API_KEY'])
  ],
  server: {
    port: 3000
  }
});