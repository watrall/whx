import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { existsSync, mkdirSync, copyFileSync, createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const base = process.env.VITE_BASE || '/wikidata-world-heritage/';

export default defineConfig(({ command }) => ({
  root: __dirname,
  base: command === 'build' ? base : '/',
  plugins: [
    react(),
    {
      name: 'serve-data',
      configureServer(server) {
        server.middlewares.use('/data/sites.json', (req, res, next) => {
          const file = resolve(repoRoot, 'data/sites.json');
          if (!existsSync(file)) return next();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          createReadStream(file).pipe(res);
        });
      },
      closeBundle() {
        const src = resolve(repoRoot, 'data/sites.json');
        const dest = resolve(__dirname, 'dist/data/sites.json');
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(src, dest);
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
