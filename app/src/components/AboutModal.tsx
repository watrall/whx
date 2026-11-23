import { Modal } from './Modal.tsx';

const LINKS = [
  { label: 'Wikidata', href: 'https://www.wikidata.org/' },
  { label: 'UNESCO', href: 'https://whc.unesco.org/' },
  { label: 'GitHub', href: 'https://github.com/watrall/whx' },
];

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="About World Heritage Explorer" width="lg">
      <p className="text-sm leading-relaxed text-muted">
        An independent, map-first explorer for UNESCO World Heritage Sites. Filter by type, criterion or
        danger, scrub the inscription timeline, and open a site for its story.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The sites, countries, years, criteria, coordinates and descriptions come from UNESCO's World Heritage
        Centre; the descriptions are published under CC BY-SA 3.0 IGO. Photos and the Wikidata links come from
        Wikidata and Wikimedia Commons. Map tiles are © OpenStreetMap contributors (Atlas), CARTO (Streets)
        and Esri (Satellite). Not affiliated with UNESCO; verify details on the official site.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Museum icon by{' '}
        <a
          href="https://www.flaticon.com/free-icon/museum_6981458"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-line underline-offset-2 hover:text-ink"
        >
          juicy_fish
        </a>{' '}
        on Flaticon. Map pin icons from{' '}
        <a
          href="https://fontawesome.com/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-line underline-offset-2 hover:text-ink"
        >
          Font Awesome Free
        </a>{' '}
        (CC BY 4.0).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {LINKS.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex h-8 items-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
          >
            {label}
          </a>
        ))}
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">Keyboard shortcuts</h3>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs text-muted">
          <dt className="flex items-center gap-1">
            <span className="kbd">/</span>
          </dt>
          <dd>Search</dd>
          <dt className="flex items-center gap-1">
            <span className="kbd">1</span>
            <span className="kbd">2</span>
            <span className="kbd">3</span>
          </dt>
          <dd>Toggle cultural, natural, mixed</dd>
          <dt className="flex items-center gap-1">
            <span className="kbd">Space</span>
          </dt>
          <dd>Play or pause the timeline</dd>
          <dt className="flex items-center gap-1">
            <span className="kbd">Esc</span>
          </dt>
          <dd>Close panels</dd>
          <dt className="flex items-center gap-1">
            <span className="kbd">?</span>
          </dt>
          <dd>This dialog</dd>
        </dl>
      </div>
    </Modal>
  );
}
