import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'lucide-react', // Keep the general package for other potential imports
      'lucide-react/dist/esm/icons/users',
      'lucide-react/dist/esm/icons/trending-up',
      'lucide-react/dist/esm/icons/dollar-sign',
      'lucide-react/dist/esm/icons/file-text',
      'lucide-react/dist/esm/icons/arrow-up-right',
      'lucide-react/dist/esm/icons/arrow-down-right',
    ]
  }
});
