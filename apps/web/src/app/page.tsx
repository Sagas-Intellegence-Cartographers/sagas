/**
 * The home page. A map, and one place.
 *
 * ---
 *
 * READ THIS ONE, THEN DO THE NEXT FIVE.
 *
 * This page is the worked example: data comes from one place, gets passed down
 * as props, and the components that render it are finished rather than stubbed.
 * Three of them are done: `MapUnavailable`, `IntegrityBadge` and
 * `ConfidenceIndicator`. Everything else in `src/features` is one line and a TODO.
 *
 * Doing one of those is a well-shaped first task. Open the stub, read the
 * comment, look at the acceptance case it names, and build it the way these
 * three are built.
 *
 * THE SHAPE WORTH COPYING
 *
 * The page reads data. The components do not. That is what lets the same
 * components render against four different fixture states on /dev, and it is
 * what will let them render against a database later without changing.
 *
 * WHAT IS DELIBERATELY NOT HERE
 *
 * A design. Grey text on white with system fonts is a placeholder and the
 * visual identity is your deliverable. Replace all of it.
 *
 * The map. `MapView` is a stub. Integrating Mapbox is the centrepiece of this
 * layer and doing it for you would take the most interesting work in the scope.
 */

import Link from 'next/link';
import { DEFAULT_SITE, getSiteState, listSites } from '@sagas/read-model';
import { MapView } from '@/features/map/MapView';
import { IntegrityBadge } from '@/features/site/IntegrityBadge';
import { ConfidenceIndicator } from '@/features/article/ConfidenceIndicator';

export default function Page() {
  const sites = listSites();
  const state = getSiteState(DEFAULT_SITE, 't3');

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-10 font-sans text-neutral-900">
      <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Development data. Every contributor and claim below is invented. Do not
        show it to anyone as though it were testimony.
      </p>

      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Sagas</h1>
        <p className="text-sm text-neutral-600">
          What people remember about places, kept attributed and kept in
          disagreement.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Places
        </h2>
        <MapView sites={sites} />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-medium">{state.site.name}</h2>
          <p className="text-sm text-neutral-600">
            {state.site.address}, {state.site.city}
          </p>
          <IntegrityBadge integrity={state.integrity} />
        </div>

        {/*
          Claims arrive ordered by weight, strongest first. Keep that order.
          It is how the best-supported reading leads without anything being
          marked "accepted" and without the others being hidden.
        */}
        <ol className="space-y-6 border-t border-neutral-200 pt-5">
          {/* Dispute claims show under the claim they dispute, not as entries of their own. */}
          {state.claims.filter((c) => !c.claim.disputedClaimId).map((claim) => (
            <li key={claim.claim.id} className="space-y-1.5">
              <p className="text-sm leading-relaxed">
                {claim.claim.awaitingTranslation
                  ? claim.claim.sourceLanguageText
                  : claim.claim.text}
              </p>
              <p className="text-xs text-neutral-500">
                {claim.contributor.displayName}
                {claim.contributor.fictional && ' · invented'}
              </p>
              <ConfidenceIndicator claim={claim} />
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-neutral-200 pt-5 text-xs text-neutral-600">
        <Link href="/dev" className="underline">
          /dev
        </Link>{' '}
        renders these components against all four fixture states with the
        acceptance cases for each.
      </footer>
    </div>
  );
}
