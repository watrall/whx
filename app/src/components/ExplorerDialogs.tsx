import type { Explorer } from '../lib/useExplorer.ts';
import { AboutModal } from './AboutModal.tsx';
import { SearchOverlay } from './SearchOverlay.tsx';
import { WorldHeritageDialog } from './WorldHeritageDialog.tsx';

export function ExplorerDialogs({ explorer }: { explorer: Explorer }) {
  return (
    <>
      <SearchOverlay
        open={explorer.searchOpen}
        onClose={() => explorer.setSearchOpen(false)}
        query={explorer.query}
        onQueryChange={explorer.changeQuery}
        sites={explorer.filtered}
        selectedId={explorer.selectedSite?.id ?? null}
        onSelect={explorer.select}
        recent={explorer.recent}
        onClearRecent={explorer.clearRecent}
        mobile={!explorer.isDesktop}
      />
      <AboutModal open={explorer.aboutOpen} onClose={() => explorer.setAboutOpen(false)} />
      <WorldHeritageDialog
        open={explorer.introVisible || explorer.guideOpen}
        view={explorer.guideOpen ? 'guide' : 'intro'}
        canGoBack={explorer.introVisible}
        onReadMore={() => explorer.setGuideOpen(true)}
        onBack={() => explorer.setGuideOpen(false)}
        onClose={(remember) => {
          explorer.setGuideOpen(false);
          explorer.closeIntro(remember);
        }}
        onAbout={(remember) => {
          explorer.setGuideOpen(false);
          explorer.closeIntro(remember);
          explorer.setAboutOpen(true);
        }}
      />
    </>
  );
}
