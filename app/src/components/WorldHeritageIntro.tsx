import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo.tsx';
import { Modal } from './Modal.tsx';

/**
 * Plain-language context for the list, drawn from UNESCO's own pages:
 * https://www.unesco.org/en/world-heritage and https://whc.unesco.org/en/convention
 */

/** A small bordered link to a UNESCO page. 44px tall on touch screens, compact on desktop. */
const CHIP =
  'focus-ring inline-flex min-h-11 items-center gap-1 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas lg:min-h-8';

function ChipLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={CHIP}>
      {children}
      <ArrowUpRight className="h-3 w-3 text-muted" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

interface IntroModalProps {
  open: boolean;
  /** `remember` is true when the visitor ticked "Don't show this again". */
  onClose: (remember: boolean) => void;
  onReadMore: (remember: boolean) => void;
}

/** A short first-visit card: what the list is, and why it is more than a list of nice places. */
export function WorldHeritageIntro({ open, onClose, onReadMore }: IntroModalProps) {
  const [remember, setRemember] = useState(false);
  const checkId = useId();

  return (
    <Modal open={open} onClose={() => onClose(remember)} title="What is World Heritage?" masthead={
        <div aria-hidden="true">
          <Logo asHeading={false} />
        </div>
      } width="lg">
      <p className="text-[15px] leading-relaxed text-ink">
        The World Heritage List is not a ranking of favorite places. It is a register kept under an
        international treaty, the 1972 Convention concerning the Protection of the World Cultural and
        Natural Heritage. UNESCO says that World Heritage sites "belong to all the peoples of the
        world, irrespective of the territory on which they are located."
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 marker:text-muted">
        <li>
          The list grew out of the international campaign, begun in 1959, to move the temples of Abu
          Simbel and Philae before the Aswan High Dam flooded them, and out of a separate effort to
          protect natural areas.
        </li>
        <li>
          The Convention treats cultural and natural heritage together, in a single document. Today,
          196 countries adhere to it.
        </li>
        <li>
          A country nominates a site, independent experts evaluate it, and the World Heritage
          Committee decides. Listing requires the country's consent and carries a duty to protect
          the site and report on its condition.
        </li>
        <li>
          Being left off the list says nothing against a place. Under Article 12 of the Convention,
          a property that is not listed may still have outstanding universal value.
        </li>
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <ChipLink href="https://whc.unesco.org/en/convention">The Convention</ChipLink>
        <ChipLink href="https://www.unesco.org/en/world-heritage">UNESCO World Heritage</ChipLink>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-4">
        <label
          htmlFor={checkId}
          className="flex min-h-11 cursor-pointer items-center gap-2.5 text-xs text-muted"
        >
          <input
            id={checkId}
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 accent-[oklch(var(--ink))]"
          />
          Don't show this again
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReadMore(remember)}
            className="focus-ring min-h-11 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:bg-canvas active:scale-95 lg:min-h-9"
          >
            Read more
          </button>
          <button
            type="button"
            onClick={() => onClose(remember)}
            className="focus-ring min-h-11 rounded-lg bg-ink px-4 text-sm font-medium text-canvas transition active:scale-95 lg:min-h-9"
          >
            Explore the map
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-ink">
      {children}
    </h3>
  );
}

/** The longer version, shown inside the About dialog. */
export function WorldHeritageGuide({ onAbout }: { onAbout: () => void }) {
  return (
    <section>
      <p className="text-[15px] leading-relaxed text-ink">
        UNESCO describes heritage as "our legacy from the past, what we live with today, and what we
        pass on to future generations." The World Heritage List applies that idea through an
        international treaty. It names places of outstanding value to humanity, and the countries
        that hold them pledge to protect them.
      </p>

      <Heading>Why the list exists</Heading>
      <p className="mt-1.5">
        Efforts to protect heritage internationally began after the First World War. The decision to
        build the Aswan High Dam in Egypt made the need urgent, because the dam would have flooded
        the valley containing the temples of Abu Simbel. After an appeal from Egypt and Sudan, UNESCO
        launched a safeguarding campaign in 1959. The temples of Abu Simbel and Philae were taken
        apart, moved to dry ground and rebuilt. The campaign cost about US$80 million, and some 50
        countries paid half of it.
      </p>
      <p className="mt-2">
        That campaign led to others, including Venice and its Lagoon, the ruins at Moenjodaro in
        Pakistan and the Borobudur temples in Indonesia. A separate line of thinking came from
        conservation. A 1965 White House conference in Washington called for a "World Heritage Trust"
        to protect natural and scenic areas as well as historic sites, and in 1968 the International
        Union for Conservation of Nature made similar proposals. The 1972 Convention brought the two
        movements together in one text.
      </p>

      <Heading>The 1972 Convention</Heading>
      <p className="mt-1.5">
        UNESCO's General Conference adopted the Convention in Paris on 16 November 1972. It entered
        into force on 17 December 1975. Its distinctive feature is that it treats nature conservation
        and the preservation of cultural sites together, recognizing how people interact with nature
        and the need to keep the two in balance.
      </p>
      <p className="mt-2">
        The Convention sets out which kinds of places can be considered and what the countries that
        join it, known as States Parties, take on. Each pledges to conserve the sites on its
        territory and to protect its national heritage more broadly. The duty of identifying,
        protecting and passing on heritage falls primarily on the country where it lies, and the
        international community cooperates in that protection. Countries report regularly to the
        World Heritage Committee on the condition of their sites. The Convention also set up the
        World Heritage Fund, which pays for technical help, training and emergency assistance. Today,
        196 countries adhere to it.
      </p>

      <Heading>How a site gets listed</Heading>
      <ol className="mt-1.5 list-decimal space-y-1.5 pl-5">
        <li>
          A country first draws up a Tentative List of the sites on its territory that it considers
          suitable. Under the 2025 Operational Guidelines, a site must be on that list, and have had
          a preliminary assessment, before a nomination counts as complete.
        </li>
        <li>
          The country then prepares a nomination showing that the place has outstanding universal
          value and meets at least one of the selection criteria. You can filter this map by those
          criteria.
        </li>
        <li>
          Independent advisory bodies evaluate the nomination: ICOMOS for cultural sites, IUCN for
          natural sites, and both for mixed sites.
        </li>
        <li>
          The World Heritage Committee decides, at its yearly session, whether to inscribe the site,
          refer it back for more information, defer it or decline it. Inscription requires the
          country's consent, and the Committee must consult the country before refusing a request.
        </li>
      </ol>
      <p className="mt-2">
        Absence from the list does not mean a place lacks value. Article 12 of the Convention says
        that a property that has not been listed may still have outstanding universal value for
        purposes other than those resulting from listing.
      </p>

      <Heading>Cultural, natural and mixed</Heading>
      <p className="mt-1.5">
        Cultural heritage covers monuments, groups of buildings and sites. Natural heritage covers
        natural features, geological formations and natural areas, including the habitat of
        threatened species. A place that qualifies under both is listed as mixed. The three colors on
        this map follow that split.
      </p>

      <Heading>After listing</Heading>
      <p className="mt-1.5">
        Listing brings continuing obligations. Countries report on the condition of their sites, and
        the Committee can place a site on the List of World Heritage in Danger. The Convention
        reserves that list for sites facing serious and specific threats, among them armed conflict,
        natural disasters, large development projects and abandonment, where major work is needed
        and the country has asked for assistance. The "danger" filter on this map shows these sites.
      </p>

      <Heading>Related conventions</Heading>
      <p className="mt-1.5">
        UNESCO has other culture conventions that protect different things. They are separate from
        the World Heritage List.
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="font-medium tabular-nums text-ink">1954</dt>
        <dd>Protecting cultural property in armed conflict (the Hague Convention).</dd>
        <dt className="font-medium tabular-nums text-ink">1970</dt>
        <dd>Preventing the illicit import, export and transfer of ownership of cultural property.</dd>
        <dt className="font-medium tabular-nums text-ink">2001</dt>
        <dd>Protecting underwater cultural heritage.</dd>
        <dt className="font-medium tabular-nums text-ink">2003</dt>
        <dd>Safeguarding intangible cultural heritage, such as traditions and living practices.</dd>
        <dt className="font-medium tabular-nums text-ink">2005</dt>
        <dd>Protecting and promoting the diversity of cultural expressions.</dd>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <ChipLink href="https://whc.unesco.org/en/convention">The Convention</ChipLink>
        <ChipLink href="https://whc.unesco.org/en/nominations/">Nominations</ChipLink>
        <ChipLink href="https://www.unesco.org/en/world-heritage">UNESCO World Heritage</ChipLink>
        <ChipLink href="https://unesco.org/en/legal-affairs/standard-setting/conventions">
          All UNESCO conventions
        </ChipLink>
      </div>
      <p className="mt-4 text-xs">
        Summarized from UNESCO's World Heritage Centre. Check the official pages for the current
        rules.
      </p>
      <div className="mt-6 border-t border-line pt-4">
        <button
          type="button"
          onClick={onAbout}
          className="focus-ring -mx-1 min-h-11 rounded px-1 text-left text-xs font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-ink lg:min-h-0"
        >
          About this project: data sources, credits and shortcuts
        </button>
      </div>
    </section>
  );
}
