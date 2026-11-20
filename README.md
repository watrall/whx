# World Heritage Explorer

A map-first explorer for UNESCO World Heritage Sites, sourced from Wikidata. Browse by type, scrub the inscription timeline, and open a site for its story.

## Features

- **1,265 unique sites** across 181 countries, plotted from Wikidata's `P1435` (heritage designation) and `P757` (UNESCO ID) properties.
- **Clustered map** with hover sync between markers and the site list.
- **Type filters** for cultural, natural, and mixed sites.
- **Inscription timeline** with drag handles and playback.
- **Search** by site name, country, or keyword (accent-insensitive).
- **Sites in view** filtering as you pan and zoom the map.
- **Detail panel** with a Wikimedia Commons image, description, UNESCO ID, criteria, and official links.
- **Responsive layout**: desktop rail + map, mobile full-bleed map with a bottom sheet.
- **Keyboard shortcuts**: `⌘K` / `/` search, `1`–`3` type filters, `Space` playback, `?` help.
- **Precomputed dataset** (`data/sites.json`) refreshed nightly by GitHub Actions.

## Running locally

```sh
npm install
npm run dev
```

Open <http://localhost:5173>. The dev server serves `data/sites.json` from the repository root.

### Production build

```sh
npm run build
npm run preview
```

The build outputs `app/dist`. The GitHub Pages base path defaults to `/wikidata-world-heritage/`; override it with `VITE_BASE` when building for another path.

### Tests

Unit tests use Node's built-in test runner:

```sh
npm test
```

The tests cover UNESCO ID normalization, inscription-year parsing, type resolution, search normalization, URL safety, and binding normalization.

## Data source

The app fetches `data/sites.json`, a precomputed SPARQL response. There is no live SPARQL fallback; if the file is missing or invalid, the app shows an error and a retry action.

To refresh the dataset locally:

```sh
npm run update-data
```

The nightly workflow `.github/workflows/update-sites.yml` runs the same script and commits the refreshed file.

### Count caveat

Wikidata contains ~1,400 records for UNESCO World Heritage Sites, while the official UNESCO list has ~1,270 entries. The difference comes from:

- Serial sites whose individual components are separate Wikidata items (e.g., the 21 components of the Historic Centre of Macau).
- Extension IDs (`123bis`, `123ter`, `123quater`, `123rev`) and numeric sub-site suffixes (`430-001`) that are counted as separate sites.

The app strips `bis`, `ter`, `quater`, `rev`, and numeric sub-site suffixes so extensions and sub-sites collapse onto their parent. This brings the unique count to 1,265 after filtering invalid coordinates, close to the official ~1,270.

## Limitations

- **Static data only.** The app reads `data/sites.json`; refreshing the dataset requires the update workflow or a local script run.
- **Client-side filtering.** All type, year, search, and viewport filtering happens in the browser.
- **Daily commits grow the repo.** Each refresh commits ~1.2 MB. For high-traffic deployments, host `data/sites.json` on a CDN or use a GitHub Release instead of committing it.
- **Wikidata data quality varies.** Coordinates, images, and descriptions are as good as the underlying Wikidata items. Some inscription years may be missing or inaccurate; for example, Wikidata records Serengeti's 1960 establishment date as its inscription year.
- **Basemap tile usage.** The app uses OpenStreetMap standard tiles. Keep usage light and preserve the attribution; for higher traffic, use a tile provider with a proper plan.
- **Image licensing varies.** Detail images come from Wikimedia Commons; reuse requires checking each file's license and attribution.

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- [Leaflet](https://leafletjs.com/) + [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- [Lucide](https://lucide.dev/) icons
- OpenStreetMap standard tiles

## Project structure

```
app/
  index.html                     # Vite HTML shell
  vite.config.ts                 # Vite config, data middleware, base path
  src/
    main.tsx                     # React entry point
    App.tsx                      # Application shell and state
    index.css                    # Tailwind and map/marker styles
    components/                  # Map, timeline, list, detail, overlays
    lib/                         # Data loading, types, utilities, hooks
  public/favicon.svg
scripts/update-data.mjs          # Refreshes data/sites.json from WDQS
data/sites.json                  # Precomputed SPARQL response (nightly)
tests/unit.test.mjs              # Unit tests for pure helpers
.github/workflows/update-sites.yml  # Daily refresh action
.github/workflows/test.yml       # CI test workflow
package.json                     # npm scripts and dependencies
README.md
LICENSE
```

## License

MIT. See [LICENSE](LICENSE).
