import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { existsSync, mkdirSync, copyFileSync, createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
// Static JSON served from /data. sites.json is Wikidata; the unesco files come from
// scripts/import-unesco.mjs.
const DATA_FILES = ['sites.json', 'unesco.json', 'unesco-text.json', 'danger.json'];
const base = process.env.VITE_BASE || '/wikidata-world-heritage/';

export default defineConfig(({ command }) => ({
  root: __dirname,
  base: command === 'build' ? base : '/',
  plugins: [
    react(),
    {
      name: 'serve-data',
      configureServer(server) {
        for (const name of DATA_FILES) {
          server.middlewares.use(`/data/${name}`, (req, res, next) => {
            const file = resolve(repoRoot, 'data', name);
            if (!existsSync(file)) return next();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            createReadStream(file).pipe(res);
          });
        }
      },
      closeBundle() {
        for (const name of DATA_FILES) {
          const src = resolve(repoRoot, 'data', name);
          if (!existsSync(src)) continue;
          const dest = resolve(__dirname, 'dist/data', name);
          mkdirSync(dirname(dest), { recursive: true });
          copyFileSync(src, dest);
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
