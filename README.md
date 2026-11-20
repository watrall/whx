# World Heritage Explorer

An independent, map-first explorer for UNESCO World Heritage Sites. It puts every property on one map and lets you explore them by place, type, theme and time, instead of paging through a list. It is not affiliated with UNESCO, and every site links back to its official UNESCO page.

## Features

**Explore the map**
- Every site on one map, with pins by type (cultural, natural, mixed) and clusters whose coloured ring shows what mix of types they contain.
- Search by site name or country.
- Filters that combine: type, In danger, Saved, selection criterion, and country. The counts on each filter update live to show what turning it on would give.
- An inscription timeline: drag the handles to a range of years, or press play to watch the List grow year by year, with a ripple on each new site.
- Near me flies the map to where you are. Surprise me opens a random site, preferring ones with a photo.

**Learn about a site**
- UNESCO's own description, with credit.
- The selection criteria in plain language, for example "Ideas and beliefs" instead of "(vi)".
- Every country a transboundary site spans, each one a filter.
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

All of the data is public. The app combines five sources, and a few things it works out itself.

### Where it comes from

| Source | What the app takes from it | Licence |
|---|---|---|
| **Wikidata** | The list of World Heritage Sites, each with its UNESCO ID, coordinates, photo, selection criteria, a one-line description, and a country and year as fallbacks | CC0 |
| **UNESCO World Heritage Centre**, XML export | The official site name, every country, the year of inscription, whether the site is in danger, and UNESCO's short description of the site | Descriptions: CC BY-SA 3.0 IGO |
| **Wikipedia**, "List of World Heritage in Danger" | A short reason, and the year listed, for sites that UNESCO flags as in danger | CC BY-SA 4.0 |
| **Wikimedia Commons** | The photographs. Each one is requested at the size it is shown, and credited with a link to its Commons page, where the author and licence are given | Set per photo |
| **OpenStreetMap** | The basemap tiles, softened so the markers stand out | ODbL |

The museum glyph in the wordmark is by [juicy_fish](https://www.flaticon.com/free-icon/museum_6981458) on Flaticon, used under the Flaticon free licence with attribution in the About panel.

The plain-language wording of the ten selection criteria is written in the app, shortened from UNESCO's published criteria.

### How the sources are combined

1. **Wikidata supplies the sites.** Entries that are extensions or revisions of the same property (UNESCO IDs ending in bis, ter, rev and similar) are folded into one by their UNESCO ID, and anything without a name or coordinates is dropped. Coordinates are Wikidata's, so each site is a single point on the map.
2. **UNESCO's export is joined on the UNESCO number.** It overrides Wikidata's name, countries and year of inscription, and supplies the danger flag. Wikidata's name stays searchable, so either spelling finds the site, and Wikidata's country name stays searchable too, so "Turkey" finds "Türkiye". A site missing from UNESCO's file keeps Wikidata's values, with years before 1978 (the first inscriptions) treated as unknown.
3. **Type comes from the criteria.** A site meeting any of criteria (i) to (vi) is cultural, any of (vii) to (x) is natural, and both is mixed.
4. **The description is UNESCO's.** Where UNESCO has none, Wikidata's one-liner is shown only if it says something, so boilerplate like "World Heritage site in Iran and Azerbaijan" is hidden.
5. **"In danger" follows UNESCO's flag.** Wikipedia's list adds the reason and start year only for sites UNESCO flags, matched by UNESCO number or name. Where the two sources disagree about which sites are in danger, UNESCO's flag wins and the Wikipedia entry is ignored. A few recent additions have no reason in either source yet, so they show the status and year only.
6. **Links are built from the UNESCO number.** The "View on UNESCO" link always points to the canonical page for the property, even when Wikidata holds an extension ID.
7. **Some figures are worked out by the app itself.** These are the nearest sites and their distances, the live filter counts, the "New" badge (the latest two inscription years), the cluster rings, and the CSV and GeoJSON exports, which contain facts and links but not UNESCO's description text.
