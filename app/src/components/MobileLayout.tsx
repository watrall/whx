import type { RefObject } from 'react';
import { Info, RotateCcw, Search, X } from 'lucide-react';
import { BASEMAPS } from '../lib/basemaps.ts';
import type { Explorer } from '../lib/useExplorer.ts';
import { formatRange } from '../lib/utils.ts';
import { Attribution } from './Attribution.tsx';
import { DataStatus } from './DataStatus.tsx';
import { DetailCard } from './DetailCard.tsx';
import { DiscoverActions } from './DiscoverActions.tsx';
import { ActiveCountryChip, Criteria, MobileTypeFilter, SharedBanner } from './ExplorerControls.tsx';
import { ExplorerDialogs } from './ExplorerDialogs.tsx';
import { ExportMenu } from './ExportMenu.tsx';
import { ListScopeToggle } from './ListScopeToggle.tsx';
import { MapView } from './MapView.tsx';
import type { MapViewHandle } from './MapView.tsx';
import { MobileSheet } from './MobileSheet.tsx';
import { PlayHint } from './PlayHint.tsx';
import { PlaybackReadout } from './PlaybackReadout.tsx';
import { ShareListButton } from './ShareListButton.tsx';
import { ListBody, ListSummary } from './SiteListPanel.tsx';
import { SortSelect } from './SortSelect.tsx';
import { Timeline } from './Timeline.tsx';

export function MobileLayout({ e, mapRef }: { e: Explorer; mapRef: RefObject<MapViewHandle | null> }) {
  return (
    <main className="relative h-dvh overflow-hidden bg-canvas text-ink">
      <h1 className="sr-only">World Heritage Explorer</h1>
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
        controlsBottomClass="bottom-[calc(152px+env(safe-area-inset-bottom)+36px)]"
        initialFocus={e.initialFocus}
        playback={e.playback}
        parts={e.partPoints}
        partsType={e.selectedSite?.type}
        basemaps={BASEMAPS}
        basemap={e.basemap}
        onBasemapChange={e.chooseBasemap}
        onBasemapFailed={e.basemapFailed}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[400] bg-gradient-to-b from-canvas/90 to-transparent px-4 pb-6 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="pointer-events-auto relative">
          <button
            type="button"
            onClick={() => e.setSearchOpen(true)}
            className="flex h-[52px] w-full items-center gap-2 rounded-2xl border border-line bg-surface/95 px-4 pr-12 text-left shadow-float backdrop-blur"
          >
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="flex-1 truncate text-base text-muted">
              {e.query || 'Search sites or countries'}
            </span>
          </button>
          {e.query && (
            <button
              type="button"
              onClick={() => e.changeQuery('')}
              aria-label="Clear search"
              className="focus-ring absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <MobileSheet
        snap={e.sheetSnap}
        onSnapChange={e.setSheetSnap}
        header={
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold text-ink">
              <span className="font-normal text-muted">Inscribed</span> {formatRange(e.yearRange)}
            </p>
            <div className="flex items-center gap-1">
              {e.extra.savedOnly && e.saved.size > 0 && (
                <ShareListButton variant="sheet" copied={e.shareCopied} onShare={e.shareSaved} />
              )}
              {e.isFiltered && (
                <button
                  type="button"
                  onClick={e.reset}
                  className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink transition hover:bg-canvas"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => e.setAboutOpen(true)}
                className="focus-ring inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => e.setGuideOpen(true)}
                aria-label="What is World Heritage?"
                className="focus-ring grid h-11 w-11 place-items-center rounded-full text-ink transition duration-150 wh-tint"
              >
                <Info className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>
        }
        peek={
          <div className="space-y-2">
            <MobileTypeFilter e={e} />
            <Timeline
              sites={e.timelineSites}
              domain={e.domain}
              value={e.yearRange}
              onChange={e.changeRange}
              playing={e.playing}
              onTogglePlay={e.togglePlay}
              nudgePlay={e.showHint}
              count={e.filtered.length}
              compact
            />
          </div>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {e.extra.country && (
            <div className="px-4 pt-2">
              <ActiveCountryChip e={e} />
            </div>
          )}
          {e.extra.listIds && (
            <div className="px-4 pt-2">
              <SharedBanner e={e} />
            </div>
          )}
          <div className="px-4 pt-2">
            <Criteria e={e} layout="inline" />
          </div>
          <DiscoverActions
            className="px-4 pb-1 pt-2"
            onSurprise={() => {
              e.surprise();
              e.setSheetSnap('peek');
            }}
            onNearMe={e.nearMe}
            notice={e.discoverNotice}
          />
          <div className="border-t border-line px-4 py-2">
            <h2 className="sr-only">Sites</h2>
            <div className="flex items-center justify-between gap-2">
              <ListScopeToggle scope={e.listScope} onChange={e.setListScope} touch />
              <div className="flex items-center gap-2">
                <SortSelect sort={e.sort} onChange={e.setSort} hasOrigin={e.origin !== null} />
                <ExportMenu count={e.sortedCount} onExport={e.exportSites} touch />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              <ListSummary e={e} />
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <ListBody e={e} />
          </div>
        </div>
      </MobileSheet>

      {e.playing && (
        <PlaybackReadout
          year={e.playYear}
          added={e.addedInYear}
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+80px)] z-[450] -translate-x-1/2"
        />
      )}

      {e.showHint && <PlayHint placement="mobile" onDismiss={e.dismissHint} />}

      <Attribution
        credits={e.basemap.credits}
        className="pointer-events-auto fixed right-0 z-[450] rounded-tl-md bg-surface/90 px-2 py-1 bottom-[calc(152px+env(safe-area-inset-bottom))]"
      />

      <DetailCard e={e} variant="mobile" />

      <DataStatus
        loading={e.loading}
        error={e.error}
        onRetry={e.reload}
        className="fixed left-4 top-[calc(env(safe-area-inset-top)+76px)] z-[450]"
      />

      <ExplorerDialogs e={e} />
    </main>
  );
}
