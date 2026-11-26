import type { RefObject } from 'react';
import { Info } from 'lucide-react';
import { BASEMAPS } from '../lib/basemaps.ts';
import type { Explorer } from '../lib/useExplorer.ts';
import { Attribution } from './Attribution.tsx';
import { DataStatus } from './DataStatus.tsx';
import { DetailCard } from './DetailCard.tsx';
import { hasStripExtras, StripExtras, StripFilters, StripTypes } from './ExplorerControls.tsx';
import { ExplorerDialogs } from './ExplorerDialogs.tsx';
import { ExportMenu } from './ExportMenu.tsx';
import { ListScopeToggle } from './ListScopeToggle.tsx';
import { Logo } from './Logo.tsx';
import { MapActions } from './MapActions.tsx';
import { MapStrip } from './MapStrip.tsx';
import { MapTooltip } from './MapTooltip.tsx';
import { MapView } from './MapView.tsx';
import type { MapViewHandle } from './MapView.tsx';
import { PlayHint } from './PlayHint.tsx';
import { PlaybackReadout } from './PlaybackReadout.tsx';
import { ListBody, ListSummary } from './SiteListPanel.tsx';
import { SortSelect } from './SortSelect.tsx';
import { Timeline } from './Timeline.tsx';

interface DesktopLayoutProps {
  e: Explorer;
  mapRef: RefObject<MapViewHandle | null>;
  searchRef: RefObject<HTMLInputElement | null>;
}

export function DesktopLayout({ e, mapRef, searchRef }: DesktopLayoutProps) {
  return (
    <div className="flex h-dvh min-h-0 bg-canvas text-ink">
      <aside className="flex w-[384px] shrink-0 flex-col border-r border-line bg-surface">
        <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
          <Logo />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => e.setGuideOpen(true)}
              aria-label="What is World Heritage?"
              className="group relative focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink transition duration-150 wh-tint"
            >
              <Info className="h-[18px] w-[18px]" aria-hidden="true" />
              <MapTooltip placement="belowEnd">What is World Heritage?</MapTooltip>
            </button>
          </div>
        </header>

        <div className="border-t border-line px-4 py-3">
          <h2 className="sr-only">Sites</h2>
          <div className="flex items-center justify-between gap-3">
            <ListScopeToggle scope={e.listScope} onChange={e.setListScope} />
            <div className="flex shrink-0 items-center gap-2">
              <SortSelect sort={e.sort} onChange={e.setSort} hasOrigin={e.origin !== null} />
              <ExportMenu count={e.sortedCount} onExport={e.exportSites} touch={false} />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            <ListSummary e={e} />
          </p>
        </div>

        <div className="min-h-0 flex-1 border-t border-line">
          <ListBody e={e} />
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <p className="text-xs text-muted">Data: UNESCO · Wikidata</p>
          <button
            type="button"
            onClick={() => e.setAboutOpen(true)}
            className="focus-ring rounded text-xs text-muted underline decoration-line underline-offset-2 hover:text-ink"
          >
            About this project
          </button>
        </footer>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          <MapStrip
            query={e.query}
            onQueryChange={e.changeQuery}
            searchRef={searchRef}
            renderTypes={(compact) => <StripTypes e={e} compact={compact} />}
            renderFilters={(wide) => <StripFilters e={e} wide={wide} />}
            extras={hasStripExtras(e) ? <StripExtras e={e} /> : null}
            isFiltered={e.isFiltered}
            onReset={e.reset}
          />
          <MapView
            ref={mapRef}
            sites={e.filtered}
            selectedSite={e.selectedSite}
            highlightedId={e.highlightedId}
            fitKey={e.fitKey}
            onSelect={e.selectOnMap}
            onHover={e.hover}
            onBoundsChange={e.setBounds}
            onMapClick={e.clearSelection}
            controlsBottomClass="bottom-4"
            controlsSideClass="left-4"
            controlSize="sm"
            extraControls={
              <MapActions onNearMe={e.nearMe} onSurprise={e.surprise} notice={e.discoverNotice} />
            }
            initialFocus={e.initialFocus}
            playback={e.playback}
            parts={e.partPoints}
            partsType={e.selectedSite?.type}
            basemaps={BASEMAPS}
            basemap={e.basemap}
            onBasemapChange={e.chooseBasemap}
            onBasemapFailed={e.basemapFailed}
          />
          <Attribution
            credits={e.basemap.credits}
            sources={e.basemap.sources}
            className="absolute bottom-0 right-0 z-[500] rounded-tl-md bg-surface/90 px-2 py-1"
          />
          {e.playing && (
            <PlaybackReadout
              year={e.playYear}
              added={e.addedInYear}
              className="absolute left-1/2 top-[4.5rem] z-[500] -translate-x-1/2"
            />
          )}
          <DetailCard e={e} variant="desktop" />
          <DataStatus
            loading={e.loading}
            error={e.error}
            onRetry={e.reload}
            className="absolute left-4 top-[4.5rem] z-[500]"
          />
        </div>
        {e.showHint && <PlayHint placement="desktop" onDismiss={e.dismissHint} />}
        <Timeline
          sites={e.timelineSites}
          domain={e.domain}
          value={e.yearRange}
          onChange={e.changeRange}
          playing={e.playing}
          onTogglePlay={e.togglePlay}
          nudgePlay={e.showHint}
          speed={e.speed}
          onCycleSpeed={e.cycleSpeed}
          count={e.filtered.length}
        />
      </main>

      <ExplorerDialogs e={e} />
    </div>
  );
}
