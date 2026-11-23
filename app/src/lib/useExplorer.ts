import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { ListScope } from '../components/ListScopeToggle.tsx';
import type { MapViewHandle } from '../components/MapView.tsx';
import type { SheetSnap } from '../components/MobileSheet.tsx';
import { BASEMAPS } from './basemaps.ts';
import type { BasemapId } from './basemaps.ts';
import { downloadText, toCsv, toGeoJson } from './export.ts';
import { NO_EXTRA, hasExtraFilters, matchesExtra, shareListUrl } from './filters.ts';
import type { ExtraFilters } from './filters.ts';
import { nearbyOrNearest } from './geo.ts';
import { canonicalIds, findSite } from './ids.ts';
import { sortSites } from './sortSites.ts';
import type { Origin, SortKey } from './sortSites.ts';
import { playbackPool } from './timeline.ts';
import type { Bounds, Site, SiteType, YearRange } from './types.ts';
import { parseLocation } from './urlState.ts';
import { countryCount, inBounds } from './utils.ts';
import { readStored, writeStored } from './storage.ts';
import { useBasemap } from './useBasemap.ts';
import { useDebouncedValue } from './useDebouncedValue.ts';
import { useMediaQuery } from './useMediaQuery.ts';
import { usePlayHint } from './usePlayHint.ts';
import { usePlayback } from './usePlayback.ts';
import { useRecentSearches } from './useRecentSearches.ts';
import { useSavedSites } from './useSavedSites.ts';
import { DETAIL_OFFSET, useSerialParts } from './useSerialParts.ts';
import { useShortcuts } from './useShortcuts.ts';
import { useSiteFilters } from './useSiteFilters.ts';
import { useSites } from './useSites.ts';
import { useUrlSync } from './useUrlSync.ts';

const FALLBACK_DOMAIN: YearRange = [1978, 2026];
const INTRO_KEY = 'wh-intro-seen';

function clampYears(wanted: YearRange | null, domain: YearRange): YearRange {
  return wanted ? [Math.max(wanted[0], domain[0]), Math.min(wanted[1], domain[1])] : domain;
}

function detailOffset(isDesktop: boolean): [number, number] {
  return isDesktop ? [...DETAIL_OFFSET.desktop] : [...DETAIL_OFFSET.mobile];
}

export function useExplorer(
  mapRef: RefObject<MapViewHandle | null>,
  searchRef: RefObject<HTMLInputElement | null>,
) {
  const [initial] = useState(() => parseLocation(window.location));
  const pendingSite = useRef(initial.site);

  const [query, setQuery] = useState(initial.query);
  const [types, setTypes] = useState<Set<SiteType>>(() => new Set(initial.types));
  const [extra, setExtra] = useState<ExtraFilters>(() => ({
    ...NO_EXTRA,
    danger: initial.danger,
    listIds: initial.list.length > 0 ? new Set(initial.list) : null,
    criteria: new Set(initial.criteria),
    country: initial.country,
  }));
  const [yearRange, setYearRange] = useState<YearRange>(FALLBACK_DOMAIN);
  const [domain, setDomain] = useState<YearRange>(FALLBACK_DOMAIN);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('name');
  const [listScope, setListScope] = useState<ListScope>('view');
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [discoverNotice, setDiscoverNotice] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(() => readStored(INTRO_KEY) !== '1');
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [initialFocus, setInitialFocus] = useState<{ site: Site; offset: [number, number] } | null>(null);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const debouncedQuery = useDebouncedValue(query, 350);
  const { basemap, choose: chooseBasemap, fallBack: fallBackBasemap } = useBasemap(BASEMAPS);
  const { recent, addRecent, clearRecent } = useRecentSearches();
  const { saved, toggle: toggleSaved, addMany: saveMany, migrate: migrateSaved } = useSavedSites();

  const { sites, loading, error, reload } = useSites((loaded) => {
    const years = loaded.map((site) => site.year).filter((year): year is number => year !== null);
    const nextDomain: YearRange = years.length ? [Math.min(...years), Math.max(...years)] : FALLBACK_DOMAIN;
    setDomain(nextDomain);
    setYearRange(clampYears(initial.years, nextDomain));
    setExtra((prev) => (prev.listIds ? { ...prev, listIds: canonicalIds(prev.listIds, loaded) } : prev));
    migrateSaved(loaded);
    const linked = findSite(pendingSite.current, loaded);
    pendingSite.current = null;
    if (linked) {
      setSelectedSite(linked);
      setInitialFocus({ site: linked, offset: detailOffset(isDesktop) });
    }
  });

  const introVisible = introOpen && !loading && !error;
  const closeIntro = useCallback((remember: boolean) => {
    if (remember) writeStored(INTRO_KEY, '1');
    setIntroOpen(false);
  }, []);

  const hint = usePlayHint(loading || introVisible);
  const { dismiss: dismissHint } = hint;

  const { filtered, typeCounts, dangerCount, timelineSites, matchesYear, matchesQuery } = useSiteFilters(
    sites,
    { query, types, extra, saved, yearRange, domain },
  );

  const isFiltered =
    query.trim() !== '' ||
    types.size > 0 ||
    hasExtraFilters(extra) ||
    yearRange[0] !== domain[0] ||
    yearRange[1] !== domain[1];

  const playYear = yearRange[1];
  const yearAdds = useMemo(
    () => filtered.filter((site) => site.year === playYear).length,
    [filtered, playYear],
  );
  const activeYears = useMemo(() => {
    const years = new Set<number>();
    for (const site of timelineSites) if (site.year !== null) years.add(site.year);
    return [...years].sort((a, b) => a - b);
  }, [timelineSites]);

  const startPlayback = useCallback(() => {
    dismissHint();
    setSelectedSite(null);
    setHighlightedId(null);
    setSheetSnap('peek');
    mapRef.current?.fitSites(timelineSites);
  }, [dismissHint, timelineSites, mapRef]);

  const player = usePlayback({
    yearRange,
    setYearRange,
    domain,
    activeYears,
    addedInYear: yearAdds,
    onStart: startPlayback,
  });
  const { playing, stop: stopPlayback } = player;
  const addedInYear = playing ? yearAdds : 0;

  const playbackStart = yearRange[0];
  const playbackEntries = useMemo(
    () => (playing ? playbackPool(timelineSites, playbackStart, domain) : null),
    [playing, timelineSites, playbackStart, domain],
  );
  const playback = useMemo(
    () => (playbackEntries ? { entries: playbackEntries, year: playYear, speed: player.speed } : null),
    [playbackEntries, playYear, player.speed],
  );

  const typeTotal = typeCounts.cultural + typeCounts.natural + typeCounts.mixed;
  const countries = countryCount(filtered);

  const sortedFiltered = useMemo(() => sortSites(filtered, sort, origin), [filtered, sort, origin]);
  const sortedInView = useMemo(
    () => sortedFiltered.filter((site) => inBounds(site, bounds)),
    [sortedFiltered, bounds],
  );
  const listSites = listScope === 'all' ? sortedFiltered : sortedInView;

  const selectedIndex = useMemo(
    () => (selectedSite ? sortedFiltered.findIndex((site) => site.id === selectedSite.id) : -1),
    [selectedSite, sortedFiltered],
  );
  const nearby = useMemo(
    () => (selectedSite ? nearbyOrNearest(selectedSite, filtered, 3) : null),
    [selectedSite, filtered],
  );
  const detailPosition = selectedIndex >= 0 ? { index: selectedIndex, total: sortedFiltered.length } : null;

  const fitKey = [
    debouncedQuery,
    Array.from(types).sort().join(','),
    extra.danger,
    extra.savedOnly,
    extra.listIds?.size ?? '',
    [...extra.criteria].sort().join(','),
    extra.country ?? '',
  ].join('|');

  useUrlSync({
    ready: !loading,
    siteName: selectedSite?.name ?? null,
    site: selectedSite?.id ?? null,
    query: debouncedQuery,
    types,
    years: yearRange,
    domain,
    danger: extra.danger,
    list: extra.listIds,
    criteria: extra.criteria,
    country: extra.country,
  });

  useEffect(() => {
    const onPopState = () => {
      const location = parseLocation(window.location);
      const found = findSite(location.site, sites) ?? null;
      setQuery(location.query);
      setTypes(new Set(location.types));
      setYearRange(clampYears(location.years, domain));
      setExtra((prev) => ({
        ...prev,
        danger: location.danger,
        listIds: location.list.length > 0 ? canonicalIds(new Set(location.list), sites) : null,
        criteria: new Set(location.criteria),
        country: location.country,
      }));
      setSelectedSite(found);
      if (found && found.parts <= 1) mapRef.current?.focusSite(found, { offset: detailOffset(isDesktop) });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [sites, domain, isDesktop, mapRef]);

  const partPoints = useSerialParts(selectedSite, isDesktop, mapRef);

  const clearSelection = useCallback(() => setSelectedSite(null), []);

  const changeQuery = useCallback((value: string) => {
    setQuery(value);
    setSelectedSite(null);
  }, []);

  const clearTypes = useCallback(() => {
    setTypes(new Set());
    setSelectedSite(null);
  }, []);

  const toggleType = useCallback((type: SiteType) => {
    setSelectedSite(null);
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const toggleDanger = useCallback(() => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, danger: !prev.danger }));
  }, []);

  const toggleSavedOnly = useCallback(() => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, savedOnly: !prev.savedOnly }));
  }, []);

  const toggleCriterion = useCallback((code: string) => {
    setSelectedSite(null);
    setExtra((prev) => {
      const criteria = new Set(prev.criteria);
      if (criteria.has(code)) criteria.delete(code);
      else criteria.add(code);
      return { ...prev, criteria };
    });
  }, []);

  const clearCriteria = useCallback(() => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, criteria: new Set() }));
  }, []);

  const filterCountry = useCallback((country: string | null) => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, country }));
  }, []);

  const showAllShared = useCallback(() => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, listIds: null }));
  }, []);

  const reset = useCallback(() => {
    setQuery('');
    setTypes(new Set());
    setSort((current) => (current === 'distance' ? 'name' : current));
    setExtra(NO_EXTRA);
    setYearRange(domain);
    setSelectedSite(null);
    setHighlightedId(null);
    stopPlayback();
    setSearchOpen(false);
    setSheetSnap('peek');
    mapRef.current?.fitAll();
  }, [domain, stopPlayback, mapRef]);

  const select = useCallback(
    (site: Site) => {
      addRecent(query);
      setSelectedSite(site);
      setSearchOpen(false);
      setHighlightedId(null);
      if (!isDesktop) setSheetSnap('peek');
      if (site.parts <= 1) mapRef.current?.focusSite(site, { offset: detailOffset(isDesktop) });
    },
    [addRecent, query, isDesktop, mapRef],
  );

  const step = useCallback(
    (delta: -1 | 1) => {
      const next = sortedFiltered[selectedIndex + delta];
      if (next) select(next);
    },
    [sortedFiltered, selectedIndex, select],
  );

  const surprise = useCallback(() => {
    const withImage = filtered.filter((site) => site.image);
    const pool = withImage.length > 0 ? withImage : filtered;
    if (pool.length === 0) return;
    select(pool[Math.floor(Math.random() * pool.length)]);
  }, [filtered, select]);

  const nearMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setDiscoverNotice('Location is not available in this browser.');
      return;
    }
    setDiscoverNotice('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDiscoverNotice(null);
        setSelectedSite(null);
        const here = { lat: position.coords.latitude, lon: position.coords.longitude };
        setOrigin(here);
        setSort('distance');
        mapRef.current?.flyToPoint(here.lat, here.lon, 6);
      },
      () => setDiscoverNotice('Could not get your location. Check browser permissions.'),
      { timeout: 8000, maximumAge: 300000 },
    );
  }, [mapRef]);

  const exportSites = useCallback(
    (format: 'csv' | 'geojson') => {
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        downloadText(`world-heritage-sites-${stamp}.csv`, 'text/csv', toCsv(sortedFiltered));
      } else {
        downloadText(
          `world-heritage-sites-${stamp}.geojson`,
          'application/geo+json',
          toGeoJson(sortedFiltered),
        );
      }
    },
    [sortedFiltered],
  );

  const shareSaved = useCallback(async () => {
    const url = shareListUrl(saved, `${window.location.origin}/`);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
    }
  }, [saved]);

  const basemapFailed = useCallback(
    (id: BasemapId) => {
      if (id === BASEMAPS[0].id) return;
      fallBackBasemap();
      setDiscoverNotice('That map style is not available right now. Showing Atlas.');
      window.setTimeout(() => setDiscoverNotice(null), 6000);
    },
    [fallBackBasemap],
  );

  const criteriaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const without = { ...extra, criteria: new Set<string>() };
    for (const site of sites) {
      if (types.size > 0 && !types.has(site.type)) continue;
      if (!matchesYear(site) || !matchesQuery(site) || !matchesExtra(site, without, saved)) continue;
      for (const code of site.criteriaCodes) counts[code] = (counts[code] ?? 0) + 1;
    }
    return counts;
  }, [sites, types, matchesYear, matchesQuery, extra, saved]);

  const dialogOpen = aboutOpen || guideOpen || searchOpen || introVisible;
  const showHint = hint.ready && !hint.seen && !playing && !selectedSite && !dialogOpen;

  const closeAll = useCallback(() => {
    setSearchOpen(false);
    setAboutOpen(false);
    setGuideOpen(false);
    setSelectedSite(null);
    setSheetSnap('peek');
  }, []);

  const openSearch = useCallback(() => {
    if (isDesktop) searchRef.current?.focus();
    else setSearchOpen(true);
  }, [isDesktop, searchRef]);

  const openAbout = useCallback(() => setAboutOpen(true), []);

  useShortcuts({
    paused: dialogOpen,
    hasSelection: selectedSite !== null,
    onEscape: closeAll,
    onSearch: openSearch,
    onAbout: openAbout,
    onToggleType: toggleType,
    onPlayToggle: player.toggle,
    onStep: step,
  });

  const hover = useCallback((site: Site | null) => setHighlightedId(site?.id ?? null), []);

  const sharedUnsaved = extra.listIds ? [...extra.listIds].filter((id) => !saved.has(id)).length : 0;
  const saveAllShared = () => {
    if (extra.listIds) saveMany(extra.listIds);
  };

  return {
    loading,
    error,
    reload,
    query,
    changeQuery,
    types,
    typeCounts,
    typeTotal,
    toggleType,
    clearTypes,
    extra,
    dangerCount,
    toggleDanger,
    toggleSavedOnly,
    toggleCriterion,
    clearCriteria,
    criteriaCounts,
    filterCountry,
    showAllShared,
    sharedUnsaved,
    saveAllShared,
    saved,
    toggleSaved,
    shareSaved,
    shareCopied,
    filtered,
    countries,
    isFiltered,
    reset,
    yearRange,
    domain,
    changeRange: player.changeRange,
    timelineSites,
    playing,
    playYear,
    addedInYear,
    speed: player.speed,
    cycleSpeed: player.cycleSpeed,
    togglePlay: player.toggle,
    playback,
    showHint,
    dismissHint: hint.dismiss,
    sort,
    setSort,
    origin,
    listScope,
    setListScope,
    listSites,
    sortedCount: sortedFiltered.length,
    exportSites,
    selectedSite,
    select,
    selectOnMap: setSelectedSite,
    clearSelection,
    step,
    hover,
    highlightedId,
    nearby,
    detailPosition,
    partPoints,
    surprise,
    nearMe,
    discoverNotice,
    setBounds,
    fitKey,
    initialFocus,
    basemap,
    chooseBasemap,
    basemapFailed,
    isDesktop,
    sheetSnap,
    setSheetSnap,
    searchOpen,
    setSearchOpen,
    recent,
    clearRecent,
    aboutOpen,
    setAboutOpen,
    guideOpen,
    setGuideOpen,
    introVisible,
    closeIntro,
  };
}

export type Explorer = ReturnType<typeof useExplorer>;
