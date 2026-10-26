/**
 * 1116 Hays Street — contribution event log
 * =========================================
 *
 * The other half of the pair. Its neighbour at 1114 is a separate site about
 * twelve metres away. See that file for what the pair is for.
 *
 * THIS CONTENT IS INVENTED, including the business names. The street and the
 * coordinates are real. There were no such shops and there are no such people.
 *
 * Authored as an append-only log. States are derived, never authored. See
 * ../../src/reduce.ts.
 */

import type { ContributionEvent } from '../../src/events';

const SITE = 'site-hays-1116';

export const events: ContributionEvent[] = [
  {
    id: 'hy-001', at: '2026-04-09T10:14:00Z', actorId: 'system',
    kind: 'site_created',
    siteId: SITE,
    slug: 'hays-1116',
    name: '1116 Hays Street',
    aka: ['the bakery', 'the place with the blue door'],
    coordinates: [-116.20630, 43.62216],
    address: '1116 Hays St',
    city: 'Boise, Idaho',
  },

  {
    id: 'hy-002', at: '2026-04-09T10:15:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-esther',
    displayName: 'Esther Lindqvist',
  },

  {
    id: 'hy-003', at: '2026-04-09T10:31:00Z', actorId: 'c-esther',
    kind: 'record_submitted',
    recordId: 'rec-hays-bakery',
    siteId: SITE,
    text: 'A bakery, then a print shop, then empty for a long time. The blue door is still there.',
    language: 'en',
  },

  {
    id: 'hy-004', at: '2026-04-09T10:36:00Z', actorId: 'c-esther',
    kind: 'claim_submitted',
    claimId: 'cl-hays-bakery',
    sourceRecordId: 'rec-hays-bakery',
    siteId: SITE,
    text: 'There was a bakery at 1116 before it became a print shop. You could smell it from the end of the block on a Saturday. There was a doorway through to the shop next door, cut through the party wall, and the two of them used it as one premises for a while.',
    sourceLanguage: 'en',
    details: [
      { id: 'el-hy-trade', kind: 'event', value: 'bakery', excerpt: 'There was a bakery at 1116' },
      { id: 'el-hy-door', kind: 'place', value: 'doorway through the party wall', excerpt: 'a doorway through to the shop next door' },
    ],
    sourceType: 'community_oral',
  },


  // Registered again here, for the same reason as in the 1114 log. He is the
  // contributor next door and he cannot speak to the doorway.
  {
    id: 'hy-006', at: '2026-07-08T18:21:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-tomas',
    displayName: 'Tomás Iriarte',
  },

  {
    id: 'hy-007', at: '2026-07-08T18:22:00Z', actorId: 'c-tomas',
    kind: 'passover_recorded',
    passoverId: 'pv-hy-tomas',
    claimId: 'cl-hays-bakery',
    passoverKind: 'dont_know',
  },
];

export const stateCuts = [
  { stateId: 't0', label: 'Created, one claim about the shop next door', asOf: '2026-04-30T23:59:59Z' },
  { stateId: 't1', label: 'Unchanged', asOf: '2026-05-31T23:59:59Z' },
  { stateId: 't2', label: 'Unchanged', asOf: '2026-06-30T23:59:59Z' },
  { stateId: 't3', label: 'The neighbour cannot speak to the doorway', asOf: '2026-07-31T23:59:59Z' },
];
