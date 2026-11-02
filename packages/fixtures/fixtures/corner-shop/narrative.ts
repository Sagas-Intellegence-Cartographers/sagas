/**
 * The corner shop — sections and passages
 * =======================================
 *
 * INVENTED STAND-INS. Nothing here is derived from the event log. These are the
 * sections and passages a page can expect once the intelligence layer produces
 * them, written by hand so the page can be built now. See ../../src/narrative.ts.
 *
 * WHAT THIS SHOWS
 *
 *   - t0 has no sections. A photograph with nothing claimed about it has no
 *     passage to write. The page shows the record on its own.
 *   - From t1, a passage whose phrases lead back to the claim. Once something
 *     points at an excerpt, from t2, a phrase can lead to that detail too.
 *   - At t2 the year is disputed, and the passage says "sometime in the 1950s",
 *     which both readings fit. Selecting it leads to the date detail, where
 *     both readings sit side by side. The passage does not pick one.
 *   - At t2 one phrase leads to two claims: the owner's name comes from the
 *     first claim, and the relative's extension adds to it.
 *   - At t3 a second section, for the sign. One of its spans points at a whole
 *     claim with no detail, so both forms of span appear.
 */

import { detailId } from '@sagas/contracts';
import { span } from '../../src/narrative';
import type { SiteNarrative } from '../../src/narrative';

const SITE = 'site-corner-shop';

const shopSection = { id: 'sec-cs-shop', siteId: SITE, heading: 'The shop on the corner' };
const signSection = { id: 'sec-cs-sign', siteId: SITE, heading: 'The sign' };

const t1Text =
  'The shop stood on the corner of Fourth and Main, and its owner was Mr. Ferris. ' +
  'A photograph shows it around 1950.';

const t2Text =
  'The shop stood on the corner of Fourth and Main. Its owner, Mr. Ferris, ' +
  'ran it until the sixties. A photograph shows it sometime in the 1950s.';

const signText = 'A sign reading FERRIS GROCERY came down when the shop closed.';

const t2Shop = {
  id: 'cmp-cs-shop',
  sectionId: shopSection.id,
  text: t2Text,
  spans: [
    span(t2Text, 'the corner of Fourth and Main', ['cl-cs-shop']),
    span(t2Text, 'Mr. Ferris', ['cl-cs-shop', 'cl-cs-uncle'], [detailId('cl-cs-shop', 'the owner, Mr. Ferris')]),
    span(t2Text, 'until the sixties', ['cl-cs-uncle']),
    span(t2Text, 'sometime in the 1950s', ['cl-cs-shop'], [detailId('cl-cs-shop', 'around 1950')]),
  ],
};

export const narrative: SiteNarrative = {
  t1: {
    sections: [shopSection],
    compositions: [
      {
        id: 'cmp-cs-shop',
        sectionId: shopSection.id,
        text: t1Text,
        spans: [
          span(t1Text, 'the corner of Fourth and Main', ['cl-cs-shop']),
          span(t1Text, 'Mr. Ferris', ['cl-cs-shop']),
          span(t1Text, 'around 1950', ['cl-cs-shop']),
        ],
      },
    ],
  },
  t2: {
    sections: [shopSection],
    compositions: [t2Shop],
  },
  t3: {
    sections: [shopSection, signSection],
    compositions: [
      t2Shop,
      {
        id: 'cmp-cs-sign',
        sectionId: signSection.id,
        text: signText,
        spans: [
          span(signText, 'FERRIS GROCERY', ['cl-cs-sign']),
          span(signText, 'came down when the shop closed', ['cl-cs-sign']),
        ],
      },
    ],
  },
};
