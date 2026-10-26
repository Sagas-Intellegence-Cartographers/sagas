/**
 * The places, as a list.
 *
 * ---
 *
 * WORKED EXAMPLE. It is finished rather than stubbed because it ships either way.
 *
 * Two reasons this ships whether or not there is a map:
 *
 * 1. A map alone is unusable with a screen reader. This list is how the same
 *    information reaches somebody who cannot see it, so this project treats it
 *    as part of meeting WCAG 2.1 AA rather than a fallback for a missing token.
 * 2. Anybody can work on the whole application without registering for
 *    anything. Nobody is blocked waiting on a Mapbox account.
 *
 * It renders when there is no token, and it should keep rendering when there is
 * one, whether beside the map or behind a toggle.
 *
 * Docs:
 *   Lists and semantics   https://www.w3.org/WAI/tutorials/page-structure/content/
 *   Tailwind utilities    https://tailwindcss.com/docs/utility-first
 */

import Link from 'next/link';
import type { Site } from '@sagas/contracts';

export function MapUnavailable({ sites }: { sites: Site[] }) {
  if (sites.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        No places in the archive yet.
      </p>
    );
  }

  return (
    <nav aria-label="Places in the archive">
      <ul className="divide-y divide-neutral-200">
        {sites.map((site) => (
          <li key={site.id} className="py-3">
            <Link
              href={`/sites/${site.slug}`}
              className="group block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              <span className="text-sm font-medium text-neutral-900 group-hover:underline">
                {site.name}
              </span>
              <span className="mt-0.5 block text-xs text-neutral-600">
                {site.address}, {site.city}
              </span>
              {/*
                What people actually call it. Search has to find a place by its
                nickname, and a reader recognises "the depot" faster than the
                formal name.
              */}
              {site.aka.length > 0 && (
                <span className="mt-0.5 block text-xs text-neutral-500">
                  also called {site.aka.slice(0, 3).join(', ')}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
