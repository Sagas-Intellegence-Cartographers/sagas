/**
 * Every site the fixtures hold.
 *
 * One entry per directory under `fixtures/`. Adding a site means writing its
 * event log and adding a line here. Nothing else in the package needs to know
 * the site exists.
 *
 * `corner-shop` is the flagship and the one to read first. It is the worked
 * example from `docs/HOW-THE-LAYERS-FIT.md`: details, evidence, and separate
 * conversations about one place. `freight-depot` is the longest log and carries the
 * translation, rendering, transcript-by-window, link and collection cases. The others
 * exist so that the map has more than one pin, so that "everything within two
 * kilometres" has something to find, and so that a contributor can appear in
 * more than one place.
 */

import type { ContributionEvent } from '../src/events';
import type { SiteNarrative } from '../src/narrative';

export interface SiteFixture {
  /** Directory name, and the filename stem of the generated states. */
  key: string;
  events: ContributionEvent[];
  cuts: { stateId: string; label: string; asOf: string }[];
  /** Invented sections and passages, per state. See `src/narrative.ts`. */
  narrative?: SiteNarrative;
}

import { events as freightDepot, stateCuts as freightDepotCuts } from './freight-depot/events';
import { events as gaskells, stateCuts as gaskellsCuts } from './gaskells-lunch-counter/events';
import { events as bench, stateCuts as benchCuts } from './hoefer-bench/events';
import { events as hays1114, stateCuts as hays1114Cuts } from './hays-1114/events';
import { events as hays1116, stateCuts as hays1116Cuts } from './hays-1116/events';
import { events as cornerShop, stateCuts as cornerShopCuts } from './corner-shop/events';
import { narrative as cornerShopNarrative } from './corner-shop/narrative';

export const siteFixtures: SiteFixture[] = [
  { key: 'freight-depot', events: freightDepot, cuts: freightDepotCuts },
  { key: 'gaskells-lunch-counter', events: gaskells, cuts: gaskellsCuts },
  { key: 'hoefer-bench', events: bench, cuts: benchCuts },
  { key: 'hays-1114', events: hays1114, cuts: hays1114Cuts },
  { key: 'hays-1116', events: hays1116, cuts: hays1116Cuts },
  { key: 'corner-shop', events: cornerShop, cuts: cornerShopCuts, narrative: cornerShopNarrative },
];

/** The stem of the flagship, which several documents point at by name. */
export const FLAGSHIP = 'corner-shop';
