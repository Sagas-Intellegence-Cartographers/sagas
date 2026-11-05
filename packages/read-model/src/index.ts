/**
 * Every read the experience layer does goes through here.
 *
 * Today these functions read fixture JSON off disk. That is a starting point,
 * not the design. Putting a real database behind them is the first
 * infrastructure job on this layer, and nothing that calls them changes when
 * you do, which is why they sit in one package.
 *
 * Two things import this and only two: `apps/web`, which calls it directly from
 * server components, and `apps/ui-api`, which exposes it over HTTP for the
 * browser. Server components should keep calling it directly. A server making a
 * network request to its own API to render a page is the classic mistake in this
 * shape.
 *
 * Rule: components take data as props. Pages and route handlers call these
 * functions and pass the result down. If you find yourself importing fixture
 * JSON inside a component, that is the mistake this package exists to prevent.
 */

import { loadIndex, loadSiteState, loadWorld } from '@sagas/fixtures/acceptance';
import type { GraphState, Site } from '@sagas/contracts';

/** The fixture snapshots that exist. Real data will not be labeled like this. */
export type FixtureStateId = 't0' | 't1' | 't2' | 't3';

export const FIXTURE_STATES: FixtureStateId[] = ['t0', 't1', 't2', 't3'];

/**
 * Every place, for the map and for search.
 *
 * With a database this becomes a query with a bounding-box filter, so the map
 * fetches what is on screen rather than the whole country to draw one
 * neighborhood. The bounding box is the argument this still does not take.
 *
 * Read `docs/GIS.md` before writing that query. "Everything within 2km" is not
 * a subtraction problem.
 */
export function listSites(stateId: FixtureStateId = 't3'): Site[] {
  return loadWorld(stateId).map((s) => s.site);
}

/** The flagship site's slug, which is what a page falls back to with no slug. */
export const DEFAULT_SITE = 'corner-shop';

/** Turn a slug into the fixture directory the states were written under. */
function keyForSlug(slug: string): string {
  const entry = loadIndex().sites.find((s) => s.slug === slug);
  if (!entry) {
    throw new Error(
      `No site with slug '${slug}'. Known slugs: ${loadIndex().sites.map((s) => s.slug).join(', ')}`,
    );
  }
  return entry.key;
}

/**
 * Everything known about one place, as of one moment.
 *
 * With a database this becomes a join across places, records, claims and
 * contributions, then the scoring pass. Watch the query count. The obvious
 * version runs one query per claim and falls over at any real size.
 */
export function getSiteState(slug: string, stateId: FixtureStateId): GraphState {
  return loadSiteState(keyForSlug(slug), stateId);
}
