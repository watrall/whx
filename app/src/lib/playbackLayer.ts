import L from 'leaflet';
import 'leaflet.markercluster';
import { hashString } from './hash.ts';
import type { Site } from './types.ts';
import { STAGGER_LIMIT, staggerBatches, staggerWindow } from './timeline.ts';
import type { PlaybackEntry } from './timeline.ts';
import { clusterIcon, markerIconHtml, typeCounts } from './utils.ts';

const CLUSTER_RADIUS = 48;

const HIDDEN_ICON = L.divIcon({ className: 'wh-ref-hidden', html: '', iconSize: [0, 0] });

type Parent = L.Marker | L.MarkerCluster;

interface Shown {
  marker: L.Marker;
  count: number;
}

export class PlaybackLayer {
  private readonly map: L.Map;
  private group: L.MarkerClusterGroup | null = null;
  private readonly display = L.layerGroup();
  private entries: PlaybackEntry<Site>[] = [];
  private markers = new Map<string, L.Marker>();
  private readonly revealed = new Set<string>();
  private members = new Map<Parent, Site[]>();
  private shown = new Map<Parent, Shown>();
  private timers: number[] = [];
  private stopped = false;

  constructor(map: L.Map, entries: PlaybackEntry<Site>[]) {
    this.map = map;
    this.display.addTo(map);
    map.on('zoomend', this.rebuild);
    this.load(entries);
  }

  setEntries(entries: PlaybackEntry<Site>[]): boolean {
    if (this.stopped || entries === this.entries) return false;
    this.clearTimers();
    this.load(entries);
    return true;
  }

  private load(entries: PlaybackEntry<Site>[]): void {
    this.group?.remove();
    this.entries = entries;
    this.markers = new Map();
    const group = L.markerClusterGroup({
      maxClusterRadius: CLUSTER_RADIUS,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      animate: false,
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: false,
      iconCreateFunction: () => HIDDEN_ICON,
    });
    const markers: L.Marker[] = [];
    for (const { site } of entries) {
      const marker = L.marker([site.lat, site.lon], {
        icon: HIDDEN_ICON,
        interactive: false,
        keyboard: false,
      });
      this.markers.set(site.id, marker);
      markers.push(marker);
    }
    group.addLayers(markers);
    group.addTo(this.map);
    this.group = group;
    this.rebuild();
  }

  reveal(year: number, speed: number): void {
    this.clearTimers();
    const wanted = new Set<string>();
    const fresh: Site[] = [];
    for (const { site, at } of this.entries) {
      if (at > year) continue;
      wanted.add(site.id);
      if (!this.revealed.has(site.id)) fresh.push(site);
    }
    for (const id of [...this.revealed]) if (!wanted.has(id)) this.revealed.delete(id);

    fresh.sort((a, b) => hashString(a.id) - hashString(b.id));
    if (fresh.length > STAGGER_LIMIT) {
      for (const site of fresh) this.revealed.add(site.id);
      this.render();
      return;
    }

    const sizes = staggerBatches(fresh.length);
    const gap = sizes.length > 1 ? staggerWindow(fresh.length) / speed / sizes.length : 0;
    let offset = 0;
    sizes.forEach((size, index) => {
      const batch = fresh.slice(offset, offset + size);
      offset += size;
      const apply = () => {
        for (const site of batch) this.revealed.add(site.id);
        this.render();
      };
      if (index === 0) apply();
      else this.timers.push(window.setTimeout(apply, gap * index));
    });
    if (sizes.length === 0) this.render();
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.clearTimers();
    this.map.off('zoomend', this.rebuild);
    this.display.remove();
    this.group?.remove();
  }

  private clearTimers(): void {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers = [];
  }

  private readonly rebuild = (): void => {
    if (this.stopped) return;
    this.members = new Map();
    for (const { site } of this.entries) {
      const marker = this.markers.get(site.id);
      if (!marker) continue;
      const parent: Parent = this.group?.getVisibleParent(marker) ?? marker;
      const sites = this.members.get(parent);
      if (sites) sites.push(site);
      else this.members.set(parent, [site]);
    }
    this.display.clearLayers();
    this.shown = new Map();
    this.render();
  };

  private render(): void {
    if (this.stopped) return;
    const live = new Set<Parent>();
    for (const [parent, sites] of this.members) {
      const visible = sites.filter((site) => this.revealed.has(site.id));
      const first = visible[0];
      if (!first) continue;
      live.add(parent);
      if (parent instanceof L.MarkerCluster) this.showCluster(parent, visible);
      else this.showPin(parent, first);
    }
    for (const [parent, entry] of this.shown) {
      if (live.has(parent)) continue;
      entry.marker.remove();
      this.shown.delete(parent);
    }
  }

  private showPin(parent: Parent, site: Site): void {
    if (this.shown.has(parent)) return;
    const marker = L.marker([site.lat, site.lon], {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        html: markerIconHtml(site.type, false, false, site.danger),
        className: 'wh-marker-wrapper wh-playing',
        iconSize: [34, 42],
        iconAnchor: [17, 40],
      }),
    }).addTo(this.display);
    this.shown.set(parent, { marker, count: 1 });
  }

  private showCluster(parent: L.MarkerCluster, visible: Site[]): void {
    const existing = this.shown.get(parent);
    if (existing?.count === visible.length) return;
    const { html, size } = clusterIcon(visible.length, typeCounts(visible.map((site) => site.type)));
    const icon = L.divIcon({
      html,
      className: 'wh-cluster-wrapper wh-playing',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    if (existing) {
      existing.marker.setIcon(icon);
      existing.count = visible.length;
      return;
    }
    const marker = L.marker(parent.getLatLng(), { interactive: false, keyboard: false, icon }).addTo(
      this.display,
    );
    this.shown.set(parent, { marker, count: visible.length });
  }
}
