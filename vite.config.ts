import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude lucide-react from pre-bundling to prevent issues with named exports
    exclude: ['lucide-react']
  }
});
