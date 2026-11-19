# Wikidata World Heritage Explorer

An interactive map of UNESCO World Heritage Sites, sourced live from Wikidata.

## Features

- **1,250+ unique sites** (1,380+ records) plotted from Wikidata's `P1435` (heritage designation) and `P757` (UNESCO ID) properties.
- **Type filtering** for cultural, natural, and mixed sites.
- **Year slider** to explore sites by inscription year.
- **Search** by site name, country, or keyword (accent-insensitive).
- **Clustering** via Leaflet.markercluster for a clean world view.
- **Popup cards** with images from Wikimedia Commons, country flags, and official UNESCO links.
- **24-hour cache** in `localStorage` to avoid repeated 20–30s SPARQL queries.

## Running locally

Any static file server works:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Data source

The app queries the [Wikidata Query Service](https://query.wikidata.org/) directly. The SPARQL query is defined in `scripts.js` as `UNESCO_SITES_QUERY`.

### Count caveat

Wikidata contains ~1,380 records for UNESCO World Heritage Sites, while the official UNESCO list has ~1,223 entries. The difference comes from:

- Serial sites whose individual components are separate Wikidata items (e.g., the 21 components of the Historic Centre of Macau).
- Extension IDs (`123bis`, `123ter`, `123quater`, `123rev`) and numeric sub-site suffixes (`430-001`) that are counted as separate sites.

The app displays both the raw record count and the count of unique UNESCO IDs. When counting unique sites, the app strips `bis`, `ter`, `quater`, `rev`, and numeric sub-site suffixes so extensions and sub-sites collapse onto their parent. This brings the unique count to ~1,251, close to the official 1,223.

## Limitations

- **Cold load takes 20–30 seconds.** The first visit runs the SPARQL query; subsequent visits within 24 hours use the cache.
- **No server-side filtering.** All filtering happens client-side.
- **Wikidata data quality varies.** Coordinates, images, and descriptions are as good as the underlying Wikidata items.

## Tech stack

- Vanilla JavaScript (no framework)
- [Leaflet](https://leafletjs.com/) + [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- [Lucide](https://lucide.dev/) icons
- [Font Awesome](https://fontawesome.com/) icons
- [flag-icons](https://flagicons.lipis.dev/) for country flags

## Project structure

```
index.html    # Markup and CDN dependencies
styles.css    # All styles
scripts.js    # Data loading, filtering, map rendering
favicon.svg   # App icon
assets/       # Placeholder and fallback images
```
