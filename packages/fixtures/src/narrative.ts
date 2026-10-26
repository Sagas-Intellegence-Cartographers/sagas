/**
 * Stand-ins for the sections and passages of a site's page.
 *
 * Nobody knows yet how claims become a readable page: which ones form a section,
 * what its heading says, or how the passage is written and kept coherent. That
 * is the intelligence layer's design work. The experience layer still has to
 * build the page now, so each site can carry invented sections here, the same
 * way `stand-in-score.ts` stands in for scoring. They are written by hand, per state,
 * and merged into the derived states by the reducer.
 *
 * Write a span by the phrase it covers, not by offsets. `span()` finds the
 * phrase and fails loudly if it is missing, so a passage can be edited without
 * recounting characters.
 */

import type { Composition, CompositionSpan, Section } from '@sagas/contracts';

export interface NarrativeStandIn {
  sections: Section[];
  compositions: Composition[];
}

/** Stand-ins for each state, keyed by state id. A state with no entry has none. */
export type SiteNarrative = Record<string, NarrativeStandIn>;

/**
 * A span over the first occurrence of `phrase` in `text`.
 *
 * Pass `detailIds` when the phrase is about particular details rather than the
 * whole claim.
 */
export function span(
  text: string,
  phrase: string,
  claimIds: string[],
  detailIds?: string[],
): CompositionSpan {
  const start = text.indexOf(phrase);
  if (start === -1) {
    throw new Error(`Phrase not found in passage: "${phrase}"`);
  }
  return {
    start,
    end: start + phrase.length,
    claimIds,
    ...(detailIds ? { detailIds } : {}),
  };
}
