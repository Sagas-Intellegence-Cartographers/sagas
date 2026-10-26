/**
 * The Hoefer bench — contribution event log
 * =========================================
 *
 * A place with one claim on it and nobody else has been near it. That is the
 * whole point of this site.
 *
 * THIS CONTENT IS INVENTED, including the name on the plaque. The path and the
 * coordinates are real. There is no such bench and no such person.
 *
 * WHAT THIS SITE IS FOR
 *
 * Most places in a real archive look like this, and for a long time. One
 * person, one contribution, nothing corroborated, an integrity score in the
 * low twenties. An interface that renders it in red, or as an empty state, or
 * as an error, tells the person who just contributed that their contribution
 * failed. It did not. It is early.
 *
 * This site exists so that failure is reachable in one click rather than
 * something a developer has to imagine. Acceptance case:
 * `sparse-site-is-not-empty-site`.
 *
 * It also covers "a place with exactly one claim and no contributors beyond
 * its author", which the fixtures README lists as uncovered.
 *
 * Authored as an append-only log. States are derived, never authored. See
 * ../../src/reduce.ts.
 */

import type { ContributionEvent } from '../../src/events';

const SITE = 'site-hoefer-bench';

export const events: ContributionEvent[] = [
  {
    id: 'hb-001', at: '2026-05-19T15:11:00Z', actorId: 'system',
    kind: 'site_created',
    siteId: SITE,
    slug: 'hoefer-bench',
    name: 'The Hoefer bench',
    aka: ['the bench by the cottonwoods', 'the green bench'],
    coordinates: [-116.21402, 43.60338],
    address: 'Greenbelt path, near the Americana bridge',
    city: 'Boise, Idaho',
  },

  {
    id: 'hb-002', at: '2026-05-19T15:12:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-nadia',
    displayName: 'Nadia Hoefer',
  },

  {
    id: 'hb-003', at: '2026-05-19T15:28:00Z', actorId: 'c-nadia',
    kind: 'record_submitted',
    recordId: 'rec-plaque',
    siteId: SITE,
    note: 'The plaque on the back rail. It has her name and two dates and nothing else.',
    media: [
      {
        mediaId: 'med-plaque',
        kind: 'image',
        storageKey: 'records/rec-plaque/plaque.jpg',
        contentType: 'image/jpeg',
        byteSize: 1_204_880,
        originalFilename: 'plaque.jpg',
        processing: 'ready',
        width: 2016,
        height: 1512,
      },
    ],
  },

  {
    id: 'hb-004', at: '2026-05-19T15:34:00Z', actorId: 'c-nadia',
    kind: 'claim_submitted',
    claimId: 'cl-bench-grandmother',
    sourceRecordId: 'rec-plaque',
    siteId: SITE,
    text: 'My grandmother walked this stretch every morning for about thirty years. After she died the family put the bench here because it is the spot where she used to stop and look at the water. The plaque was my aunt\'s idea.',
    sourceLanguage: 'en',
    details: [
      { id: 'el-hb-person', kind: 'person', value: 'Margarethe Hoefer', excerpt: 'My grandmother' },
      { id: 'el-hb-place', kind: 'place', value: 'Greenbelt near the Americana bridge', excerpt: 'this stretch' },
    ],
    sourceType: 'family_oral',
  },
];

export const stateCuts = [
  { stateId: 't0', label: 'One claim, one contributor, nothing else', asOf: '2026-05-31T23:59:59Z' },
  { stateId: 't1', label: 'Unchanged. Most places stay like this', asOf: '2026-06-30T23:59:59Z' },
  { stateId: 't2', label: 'Still unchanged', asOf: '2026-07-31T23:59:59Z' },
  { stateId: 't3', label: 'Still unchanged', asOf: '2026-08-31T23:59:59Z' },
];
