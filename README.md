# World Heritage Explorer

An independent, map-first explorer for UNESCO World Heritage Sites. It puts every property on one map and lets you explore them by place, type, theme and time, instead of paging through a list. It is not affiliated with UNESCO, and every site links back to its official UNESCO page.

## Features

**Explore the map**
- Every site on one map, with pins by type (cultural, natural, mixed) and clusters whose coloured ring shows what mix of types they contain.
- Search by site name or country, including everyday names: "Turkey" finds "Türkiye".
- Filters that combine: type, In danger, Saved, selection criterion, and country. The counts on each filter update live to show what turning it on would give.
- An inscription timeline: drag the handles to a range of years, or press play to watch the List grow year by year, with a ripple on each new site.
- Three map styles with previews: Atlas, Streets and Satellite.
- Near me flies the map to where you are. Surprise me opens a random site, preferring ones with a photo.

**Learn about a site**
- UNESCO's own description, with credit.
- The selection criteria in plain language, for example "Ideas and beliefs" instead of "(vi)".
- Every country a transboundary site spans, each one a filter.
- Serial sites show every one of their places on the map: the Carpathian beech forests appear as all 93 parts across 18 countries, not as a single pin.
- For sites on the List of World Heritage in Danger: a red flag, the year they were listed, and a short reason.
- A photo with its credit, and a "New" badge on recent inscriptions.
- The nearest sites, with distances. Where nothing is within a day trip, it says "Nearest sites" instead.
- Directions in the device's maps app, and a link to the official UNESCO page.

**Keep and share**
- Save sites, filter to them, and share the list as a link. Saved sites stay on your device, and nothing about you is collected.
- Every view has its own link, covering the open site, search, filters and year range.
- Export what you are looking at as CSV or GeoJSON.
- The list can follow the map ("In view") or show every match ("All sites"), sorted by name, year, country or, after Near me, distance.

**On any device**
- A phone layout with a search pill, a bottom sheet and large touch targets, separate from the desktop layout.
- Keyboard shortcuts, screen-reader labels, visible focus and reduced-motion support.

## Data

All of the data is public. Unfortunately, there isn't a single, reliable API-based data source for the complete site information. As such, the app combines seven sources, and a few things it works out itself.

### Where it comes from

| Source | What the app takes from it | Licence |
|---|---|---|
| **UNESCO World Heritage Centre**, XML export | The list of sites itself: each site's official name, every country, year of inscription, category, selection criteria, whether it is in danger, UNESCO's short description, and the coordinates of every place that makes up the property | Descriptions: CC BY-SA 3.0 IGO |
| **Wikidata** | For each site, a photograph and a link to its Wikidata item | CC0 |
| **Wikipedia**, "List of World Heritage in Danger" | A short reason, and the year listed, for sites that UNESCO flags as in danger | CC BY-SA 4.0 |
| **Wikimedia Commons** | The photographs themselves. Each one is requested at the size it is shown, and credited with a link to its Commons page, where the author and licence are given | Set per photo |
| **OpenStreetMap** | The Atlas map style: basemap tiles, softened so the markers stand out | ODbL |
| **CARTO** | The Streets map style (Voyager tiles), when a free CARTO key is set | CARTO Basemaps terms; free for non-commercial use |
| **Esri** | The Satellite map style (World Imagery tiles), when a free ArcGIS key is set | Esri terms; free account |

The museum glyph in the wordmark is by [juicy_fish](https://www.flaticon.com/free-icon/museum_6981458) on Flaticon, used under the Flaticon free licence with attribution in the About panel.

The plain-language wording of the ten selection criteria is written in the app, shortened from UNESCO's published criteria.

### How the sources are combined

1. **UNESCO's export is the list.** Every site comes from it, all 1,273 of them, so the app's counts match UNESCO's own: for example 13 sites in Peru, 62 in Italy, and 54 in danger.
2. **Each site gets one pin.** Most sites have a single coordinate. A serial site has one for every place in it, and its pin is the place nearest the middle of them all. Opening a serial site draws every place and frames them together. Three sites have no coordinates in UNESCO's file: two take Wikidata's, and the First World War memorial sites use an approximate point in the middle of the Western Front.
3. **Type comes from UNESCO's category**, and the selection criteria are shown in plain language.
4. **Photographs come from Wikidata.** Each Wikidata item is matched to a UNESCO site by its UNESCO number. Where Wikidata also holds items for the individual parts of a serial site, the photo of the property itself is preferred. About 4% of sites have no photograph in Wikidata and show their type icon instead.
5. **Each card header has up to five photos.** `scripts/build-gallery.mjs` takes the Wikidata photo, then adds extras from the site's Wikimedia Commons category (found through the Wikidata Commons category property), ranking them by Commons' featured and quality marks, how many Wikipedia articles use them, resolution and shape. Maps, diagrams, small files and portrait shots are skipped. If the Wikidata photo is a poor fit (a satellite view, a very wide panorama), the best extra leads instead. Each photo is credited with its author and licence, linked to its Commons page. Sites that Commons covers thinly can be topped up from Unsplash with `node scripts/fill-unsplash.mjs`, which writes `data/unsplash.json` and needs a free API key in `UNSPLASH_ACCESS_KEY` (in the environment or a `.env` file, which is not committed). It keeps only photos whose Unsplash description, tags or location name the site, and credits the photographer and Unsplash with links. `data/photo-overrides.json` can list files to `hide` for a site. The script is slow, so a monthly workflow runs it; run `node scripts/build-gallery.mjs` yourself to fill in sites that have no entry yet. Where Wikidata's choice is a map or render rather than a photograph, `data/photo-overrides.json` names a better Commons file, and it is applied each time the photos are rebuilt.
5. **The description is UNESCO's.** Nothing is borrowed from Wikidata or Wikipedia for the description, and a site with none shows none.
6. **"In danger" follows UNESCO's flag.** Wikipedia's list adds the reason and start year only for sites UNESCO flags, matched by UNESCO number or name. Where the two sources disagree about which sites are in danger, UNESCO's flag wins and the Wikipedia entry is ignored. A few recent additions have no reason in either source yet, so they show the status and year only.
7. **Links are built from the UNESCO number.** The "View on UNESCO" link points to the property's page, and the Wikidata link goes to the item matched to it.
8. **Search understands everyday country names.** UNESCO uses formal names ("Türkiye", "Russian Federation"), so a short list of everyday names is kept alongside them.
9. **Some figures are worked out by the app itself.** These are the nearest sites and their distances, the live filter counts, the "New" badge (the latest two inscription years), the cluster rings, and the CSV and GeoJSON exports, which contain facts and links but not UNESCO's description text.
