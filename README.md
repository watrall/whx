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

## Development

`npm run dev` starts the app locally. `npm run check` runs the same steps as the Check workflow on GitHub, which are the type check, ESLint with the React hooks and accessibility rules, a Prettier format check, the unit tests and a production build. `npm run format` rewrites files to the Prettier style.

The app serves everything itself. The typeface (Quicksand) and the map pin icons are bundled, so a visit contacts only the map tile servers and the photo hosts. The `_headers` file in `app/public` sets a Content Security Policy that allows exactly those hosts, plus the usual headers against framing and content sniffing. A new image or tile host has to be added to the `img-src` list there before it will load.

### Keys

Copy `.env.example` to `.env` in the repo root and fill it in. Atlas, the default map style, needs no key. Streets needs `VITE_CARTO_KEY` and Satellite needs `VITE_ARCGIS_TOKEN`; a style whose key is missing is left out of the style picker. These two are read at build time and end up in the shipped JavaScript, so restrict each key to your domain at the provider. On Cloudflare, set them as build variables under the Worker's Settings, Builds. `UNSPLASH_ACCESS_KEY` is only for the photo script.

The GitHub Actions workflows pin each action to a commit hash.

### Links

The open site lives in the path and the filters live in the query string, for example `/site/87-chartres-cathedral?types=cultural&years=1980-1999`. Only the number after `/site/` matters, so a link with a wrong or missing slug still opens the right site and the address bar corrects itself. Opening or closing a site adds a history entry, so the Back button works. Changing a filter or stepping between sites does not. A shared saved list is `/?list=274,87,148`. Links made before this format, which kept everything after a `#`, still open and are rewritten on load. Cloudflare serves the app for every path through `not_found_handling` in `wrangler.jsonc`, and the data files are fetched from absolute paths for the same reason. That also means the app has to be served from the root of its domain.

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

The map pin icons are from [Font Awesome Free](https://fontawesome.com/) and used under the [CC BY 4.0 licence](https://creativecommons.org/licenses/by/4.0/). Quicksand, the typeface, is served from this site under the SIL Open Font Licence.

The plain-language wording of the ten selection criteria is written in the app, shortened from UNESCO's published criteria.

### How the sources are combined

1. **UNESCO's export is the list.** Every site comes from it, all 1,273 of them, so the app's counts match UNESCO's own: for example 13 sites in Peru, 62 in Italy, and 54 in danger.
2. **Each site gets one pin.** Most sites have a single coordinate. A serial site has one for every place in it, and its pin is the place nearest the middle of them all. Opening a serial site draws every place and frames them together. Three sites have no coordinates in UNESCO's file: two take Wikidata's, and the First World War memorial sites use an approximate point in the middle of the Western Front.
3. **Type comes from UNESCO's category**, and the selection criteria are shown in plain language.
4. **Photographs start from Wikidata.** Each Wikidata item is matched to a UNESCO site by its UNESCO number. Where Wikidata also holds items for the individual parts of a serial site, the photo of the property itself is preferred. Each card header then shows up to five photos; see Photo galleries below. About 4% of sites have no photograph in Wikidata, and most of those get one from the galleries.
5. **The description is UNESCO's.** Nothing is borrowed from Wikidata or Wikipedia for the description, and a site with none shows none.
6. **"In danger" follows UNESCO's flag.** Wikipedia's list adds the reason and start year only for sites UNESCO flags, matched by UNESCO number or name. Where the two sources disagree about which sites are in danger, UNESCO's flag wins and the Wikipedia entry is ignored. A few recent additions have no reason in either source yet, so they show the status and year only.
7. **Links are built from the UNESCO number.** The "View on UNESCO" link points to the property's page, and the Wikidata link goes to the item matched to it.
8. **Search understands everyday country names.** UNESCO uses formal names ("Türkiye", "Russian Federation"), so a short list of everyday names is kept alongside them.
9. **Some figures are worked out by the app itself.** These are the nearest sites and their distances, the live filter counts, the "New" badge (the latest two inscription years), the cluster rings, and the CSV and GeoJSON exports, which contain facts and links but not UNESCO's description text.

### Photo galleries

A card header shows up to five photographs. The Wikidata photo comes first, then extras from the site's Wikimedia Commons category, and sites that still have fewer than four are topped up from the images in their Wikipedia articles. Extras are ranked by Commons' featured and quality marks, how many Wikipedia articles use them, resolution and shape. Maps, diagrams, small files, portraits and panoramas are skipped, and near-duplicate shots are dropped. When Wikidata's photo is a poor fit, the best extra leads instead. Each photo is credited with its author and licence, linked to its Commons page.

Each site's gallery is written at build time to its own small file, `data/gallery/<number>.json`, and loaded when its card opens, so the page never downloads every gallery at once.

- `node scripts/build-gallery.mjs` builds `data/gallery.json` and rewrites `data/photos.json`. It is slow, so a monthly workflow runs it with `--refresh`. Run it yourself with no flags to fill in sites that have no entry yet.
- `data/photo-overrides.json` replaces a site's Wikidata photo (`photos`) or bars files from its gallery (`hide`), keyed by UNESCO number.
- `node scripts/fill-unsplash.mjs` tops up sites that Commons covers thinly from Unsplash and writes `data/unsplash.json`. It needs a free API key as `UNSPLASH_ACCESS_KEY`, in the environment or an uncommitted `.env` file. Only photos whose Unsplash description, tags or location name the site are kept, and each is credited to the photographer and to Unsplash with links.

### Image coverage and where each source falls short

No single source has good photographs of every World Heritage Site. The pipeline layers several, and each covers a different part of the list.

**Wikidata** holds at most one photograph per site, and 1,218 of the 1,274 entries have one. Quality is uneven. Some are maps, satellite views, wide panoramas or small files, and one site had a 3D render. When the Wikidata photo is a poor fit, the best photo from the layers below leads instead. That applies to 375 sites.

**Wikimedia Commons** is the main source, and 1,164 sites have a linked Commons category. Photos are ranked by Commons' featured and quality marks, by how many Wikipedia articles use them, and by resolution and shape. That ranking measures how good a photograph is, not whether it shows the site. A featured photograph of a gull filed under Rome once outranked every photograph of the Forum. Cultural sites now skip photos in animal categories, near duplicates are dropped by comparing image fingerprints, and a hide list in `data/photo-overrides.json` catches anything else that slips through.

**Wikipedia articles** fill the sites that still have fewer than four photos. The pipeline reads the images used in the site's article in every language edition and ranks each image by how many editions use it. Of the 74 sites that qualified, 19 gained photos. The others have no linked article, or their articles only use maps, diagrams and images too small to show.

**Unsplash** has an API with a free demo tier limited to 50 requests an hour, and production access needs an application and review. Its search is loose, so a photo is kept only when its description, tags or location name the site. That filter is strict and it has to be. In a first pass over the 40 sites with the fewest photos, 37 returned nothing relevant. Unsplash works for famous places and does very little for obscure ones, which are the sites that need help. Its photos live in their own file, `data/unsplash.json`, and the site shows them only when that file is deployed.

**Flickr** does not issue API keys to free accounts. Programmatic access requires a paid Pro subscription. Many institutions publish photographs on Flickr under permissive licences or public domain labels, but a free, non-commercial project cannot retrieve them through the API. That largely cancels out the benefit of those licences.

About 97 percent of sites show two or more photos and about 95 percent show four or more. Thirty-one sites show a single photo or none. They are small or obscure places with no usable image in any source, and their cards fall back to the lead photo or the site type icon.
