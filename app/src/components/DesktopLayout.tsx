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
  explorer: Explorer;
  mapRef: RefObject<MapViewHandle | null>;
  searchRef: RefObject<HTMLInputElement | null>;
}

export function DesktopLayout({ explorer, mapRef, searchRef }: DesktopLayoutProps) {
  return (
    <div className="flex h-dvh min-h-0 bg-canvas text-ink">
      <aside className="flex w-[384px] shrink-0 flex-col border-r border-line bg-surface">
        <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
          <Logo />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => explorer.setGuideOpen(true)}
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
            <ListScopeToggle scope={explorer.listScope} onChange={explorer.setListScope} />
            <div className="flex shrink-0 items-center gap-2">
              <SortSelect
                sort={explorer.sort}
                onChange={explorer.setSort}
                hasOrigin={explorer.origin !== null}
              />
              <ExportMenu count={explorer.sortedCount} onExport={explorer.exportSites} touch={false} />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            <ListSummary explorer={explorer} />
          </p>
        </div>

        <div className="min-h-0 flex-1 border-t border-line">
          <ListBody explorer={explorer} />
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <p className="text-xs text-muted">Data: UNESCO · Wikidata</p>
          <button
            type="button"
            onClick={() => explorer.setAboutOpen(true)}
            className="focus-ring rounded text-xs text-muted underline decoration-line underline-offset-2 hover:text-ink"
          >
            About this project
          </button>
        </footer>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          <MapStrip
            query={explorer.query}
            onQueryChange={explorer.changeQuery}
            searchRef={searchRef}
            renderTypes={(compact) => <StripTypes explorer={explorer} compact={compact} />}
            renderFilters={(wide) => <StripFilters explorer={explorer} wide={wide} />}
            extras={hasStripExtras(explorer) ? <StripExtras explorer={explorer} /> : null}
            isFiltered={explorer.isFiltered}
            onReset={explorer.reset}
          />
          <MapView
            ref={mapRef}
            sites={explorer.filtered}
            selectedSite={explorer.selectedSite}
            highlightedId={explorer.highlightedId}
            fitKey={explorer.fitKey}
            onSelect={explorer.selectOnMap}
            onHover={explorer.hover}
            onBoundsChange={explorer.setBounds}
            onMapClick={explorer.clearSelection}
            controlsBottomClass="bottom-4"
            controlsSideClass="left-4"
            controlSize="sm"
            extraControls={
              <MapActions
                onNearMe={explorer.nearMe}
                onSurprise={explorer.surprise}
                notice={explorer.discoverNotice}
              />
            }
            initialFocus={explorer.initialFocus}
            playback={explorer.playback}
            parts={explorer.partPoints}
            partsType={explorer.selectedSite?.type}
            basemaps={BASEMAPS}
            basemap={explorer.basemap}
            onBasemapChange={explorer.chooseBasemap}
            onBasemapFailed={explorer.basemapFailed}
          />
          <Attribution
            credits={explorer.basemap.credits}
            sources={explorer.basemap.sources}
            className="absolute bottom-0 right-0 z-map-control rounded-tl-md bg-surface/90 px-2 py-1"
          />
          {explorer.playing && (
            <PlaybackReadout
              year={explorer.playYear}
              added={explorer.addedInYear}
              className="absolute left-1/2 top-[4.5rem] z-map-control -translate-x-1/2"
            />
          )}
          <DetailCard explorer={explorer} variant="desktop" />
          <DataStatus
            loading={explorer.loading}
            error={explorer.error}
            onRetry={explorer.reload}
            className="absolute left-4 top-[4.5rem] z-map-control"
          />
        </div>
        {explorer.showHint && <PlayHint placement="desktop" onDismiss={explorer.dismissHint} />}
        <Timeline
          sites={explorer.timelineSites}
          domain={explorer.domain}
          value={explorer.yearRange}
          onChange={explorer.changeRange}
          playing={explorer.playing}
          onTogglePlay={explorer.togglePlay}
          nudgePlay={explorer.showHint}
          speed={explorer.speed}
          onCycleSpeed={explorer.cycleSpeed}
          count={explorer.filtered.length}
        />
      </main>

      <ExplorerDialogs explorer={explorer} />
    </div>
  );
}
