import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/rolling-dice.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^lit/],
      output: {
        preserveModules: true,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
