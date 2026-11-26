import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { existsSync, mkdirSync, copyFileSync, createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { siteGalleries } from './src/lib/data.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
// Static JSON served from /data: the site list and the lazily loaded descriptions, serial-site
// parts and danger notes, all built by scripts/import-*.mjs, plus the Wikidata photo list.
const DATA_FILES = ['unesco.json', 'unesco-text.json', 'unesco-parts.json', 'danger.json', 'photos.json'];

function readData(name: string) {
  const file = resolve(repoRoot, 'data', name);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

function galleries() {
  return siteGalleries(readData('photos.json'), {
    ...(readData('gallery.json') ?? {}),
    unsplash: readData('unsplash.json') ?? {},
  });
}

export default defineConfig({
  root: __dirname,
  envDir: repoRoot,
  plugins: [
    react(),
    {
      name: 'serve-data',
      configureServer(server) {
        server.middlewares.use('/data/gallery/', (req, res, next) => {
          const id = /^\/(\d+)\.json$/.exec(req.url ?? '')?.[1];
          const photos = id ? galleries()[id] : undefined;
          if (!photos) return next();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(JSON.stringify(photos));
        });
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
        const directory = resolve(__dirname, 'dist/data/gallery');
        mkdirSync(directory, { recursive: true });
        for (const [id, photos] of Object.entries(galleries())) {
          writeFileSync(resolve(directory, `${id}.json`), JSON.stringify(photos));
        }
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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          map: ['leaflet', 'leaflet.markercluster'],
        },
      },
    },
  },
});
