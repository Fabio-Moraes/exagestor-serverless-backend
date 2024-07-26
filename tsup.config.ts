import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'src/dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  loader: {
    '.pem': 'text'
  },
});