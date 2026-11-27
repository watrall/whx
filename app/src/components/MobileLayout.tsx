import type { CSSProperties, RefObject } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { BASEMAPS } from '../lib/basemaps.ts';
import { PHONE, PHONE_VARS } from '../lib/layout.ts';
import type { Explorer } from '../lib/useExplorer.ts';
import { Attribution } from './Attribution.tsx';
import { DataStatus } from './DataStatus.tsx';
import { DetailCard } from './DetailCard.tsx';
import { ActiveCountryChip, Criteria, MobileTypeFilter, SharedBanner } from './ExplorerControls.tsx';
import { ExplorerDialogs } from './ExplorerDialogs.tsx';
import { ExportMenu } from './ExportMenu.tsx';
import { TRAY_CHIP } from './FilterChip.tsx';
import { ListScopeToggle } from './ListScopeToggle.tsx';
import { LogoMark, MiniWordmark } from './Logo.tsx';
import { NearMeControl } from './MapActions.tsx';
import { MapView } from './MapView.tsx';
import type { MapViewHandle } from './MapView.tsx';
import { MobileSheet } from './MobileSheet.tsx';
import { MoreMenu } from './MoreMenu.tsx';
import { PeekStrip } from './PeekStrip.tsx';
import { PlaybackBar } from './PlaybackBar.tsx';
import { PlayHint } from './PlayHint.tsx';
import { PlaybackReadout } from './PlaybackReadout.tsx';
import { ShareListButton } from './ShareListButton.tsx';
import { ListBody } from './SiteListPanel.tsx';
import { SortSelect } from './SortSelect.tsx';
import { SurpriseButton } from './SurpriseButton.tsx';
import { TimelineRow } from './TimelineRow.tsx';

export function MobileLayout({
  explorer,
  mapRef,
}: {
  explorer: Explorer;
  mapRef: RefObject<MapViewHandle | null>;
}) {
  const mapBottom = explorer.playing ? PHONE.transport : PHONE.peek;

  return (
    <main
      className="relative h-dvh overflow-hidden bg-canvas text-ink"
      style={{ ...PHONE_VARS, '--map-bottom': `${mapBottom}px` } as CSSProperties}
    >
      <h1 className="sr-only">World Heritage Explorer</h1>
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
        controlsBottomClass="bottom-[calc(var(--map-bottom)+env(safe-area-inset-bottom)+36px)]"
        extraControls={<NearMeControl onNearMe={explorer.nearMe} notice={explorer.discoverNotice} />}
        initialFocus={explorer.initialFocus}
        playback={explorer.playback}
        parts={explorer.partPoints}
        partsType={explorer.selectedSite?.type}
        basemaps={BASEMAPS}
        basemap={explorer.basemap}
        onBasemapChange={explorer.chooseBasemap}
        onBasemapFailed={explorer.basemapFailed}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-map-top px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="pointer-events-auto relative">
          <button
            type="button"
            onClick={() => explorer.setSearchOpen(true)}
            className="flex h-[52px] w-full items-center gap-2 rounded-2xl border border-line bg-surface/95 px-4 pr-12 text-left shadow-float backdrop-blur"
          >
            <LogoMark className="h-6 w-6" />
            <span className="flex-1 truncate text-base text-muted">
              {explorer.query || 'Search sites or countries'}
            </span>
          </button>
          {explorer.query && (
            <button
              type="button"
              onClick={() => explorer.changeQuery('')}
              aria-label="Clear search"
              className="focus-ring absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <MobileTypeFilter explorer={explorer} />
      </div>

      {!explorer.playing && (
        <MobileSheet
          snap={explorer.sheetSnap}
          onSnapChange={explorer.setSheetSnap}
          pinned={
            <TimelineRow
              explorer={explorer}
              open={explorer.sheetSnap !== 'peek'}
              onToggleTray={() => explorer.setSheetSnap(explorer.sheetSnap === 'peek' ? 'mid' : 'peek')}
            />
          }
          peek={<PeekStrip explorer={explorer} />}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            {explorer.extra.country && (
              <div className="px-4 pt-2">
                <ActiveCountryChip explorer={explorer} />
              </div>
            )}
            {explorer.extra.listIds && (
              <div className="px-4 pt-2">
                <SharedBanner explorer={explorer} />
              </div>
            )}
            <h2 className="sr-only">Sites</h2>
            <div className="flex items-center justify-between gap-1.5 px-4 pt-2">
              <ListScopeToggle
                scope={explorer.listScope}
                onChange={explorer.setListScope}
                counts={{ view: explorer.inViewCount, all: explorer.sortedCount }}
              />
              <div className="flex items-center gap-1.5">
                <SortSelect
                  sort={explorer.sort}
                  onChange={explorer.setSort}
                  hasOrigin={explorer.origin !== null}
                  touch
                />
                <ExportMenu count={explorer.sortedCount} onExport={explorer.exportSites} touch />
                <MoreMenu
                  onAbout={() => explorer.setAboutOpen(true)}
                  onGuide={() => explorer.setGuideOpen(true)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 pb-2.5 pt-3">
              <Criteria explorer={explorer} layout="popover" size="chip" />
              <SurpriseButton
                onSurprise={() => {
                  explorer.surprise();
                  explorer.setSheetSnap('peek');
                }}
              />
              {explorer.isFiltered && (
                <button
                  type="button"
                  onClick={explorer.reset}
                  className={`${TRAY_CHIP} border-line bg-surface text-ink hover:bg-canvas`}
                >
                  <RotateCcw className="h-4 w-4 text-muted" aria-hidden="true" />
                  Reset
                </button>
              )}
              {explorer.extra.savedOnly && explorer.saved.size > 0 && (
                <ShareListButton
                  variant="sheet"
                  copied={explorer.shareCopied}
                  onShare={explorer.shareSaved}
                />
              )}
            </div>
            <div className="min-h-0 flex-1 border-t border-line">
              <ListBody explorer={explorer} />
            </div>
          </div>
        </MobileSheet>
      )}

      {explorer.playing && <PlaybackBar explorer={explorer} />}

      {explorer.playing && (
        <PlaybackReadout
          year={explorer.playYear}
          added={explorer.addedInYear}
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+var(--map-top))] z-map-float -translate-x-1/2"
        />
      )}

      {explorer.showHint && explorer.sheetSnap === 'peek' && !explorer.playing && (
        <PlayHint placement="mobile" onDismiss={explorer.dismissHint} />
      )}

      <div className="pointer-events-none fixed left-0 z-map-float rounded-tr-md bg-surface/90 px-2 py-1 bottom-[calc(var(--map-bottom)+env(safe-area-inset-bottom))]">
        <MiniWordmark />
      </div>

      <Attribution
        credits={explorer.basemap.credits}
        sources={explorer.basemap.sources}
        compact
        className="pointer-events-auto fixed right-0 z-map-float rounded-tl-md bg-surface px-2 py-1 bottom-[calc(var(--map-bottom)+env(safe-area-inset-bottom))]"
      />

      <DetailCard explorer={explorer} variant="mobile" />

      <DataStatus
        loading={explorer.loading}
        error={explorer.error}
        onRetry={explorer.reload}
        className="fixed left-4 top-[calc(env(safe-area-inset-top)+var(--map-top))] z-map-float"
      />

      <ExplorerDialogs explorer={explorer} />
    </main>
  );
}
