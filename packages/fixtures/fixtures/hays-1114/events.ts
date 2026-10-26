/**
 * 1114 Hays Street — contribution event log
 * =========================================
 *
 * One half of a pair. Its neighbour at 1116 is a separate site about twelve
 * metres away, which is close enough that the two markers collide at most zoom
 * levels.
 *
 * THIS CONTENT IS INVENTED, including the business names. The street and the
 * coordinates are real. There were no such shops and there are no such people.
 *
 * WHAT THIS PAIR IS FOR
 *
 * The fixtures README lists "two places close enough together to collide as
 * map markers" as a situation nothing covers. This pair covers it.
 *
 * Two things follow from that and both are the experience layer's problem.
 * Markers this close have to resolve into something a person can choose
 * between rather than one marker silently on top of another. And the two sites
 * are genuinely separate places with separate records, so merging them to
 * tidy the map would be wrong.
 *
 * The pair also shares a contributor with the lunch counter site, which is the
 * only way a contributor view has more than one place in it.
 *
 * Authored as an append-only log. States are derived, never authored. See
 * ../../src/reduce.ts.
 */

import type { ContributionEvent } from '../../src/events';

const SITE = 'site-hays-1114';

export const events: ContributionEvent[] = [
  {
    id: 'ha-001', at: '2026-04-02T17:05:00Z', actorId: 'system',
    kind: 'site_created',
    siteId: SITE,
    slug: 'hays-1114',
    name: '1114 Hays Street',
    aka: ['the shoe repair', "Vasile's"],
    coordinates: [-116.20644, 43.62211],
    address: '1114 Hays St',
    city: 'Boise, Idaho',
  },

  {
    id: 'ha-002', at: '2026-04-02T17:06:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-tomas',
    displayName: 'Tomás Iriarte',
  },

  {
    id: 'ha-003', at: '2026-04-02T17:19:00Z', actorId: 'c-tomas',
    kind: 'record_submitted',
    recordId: 'rec-hays-shoes',
    siteId: SITE,
    text: 'Shoe repair on the left, run by a Romanian family. The sign said Vasile and Sons but as far as anybody could tell there was only ever the one son.',
    language: 'en',
  },

  {
    id: 'ha-004', at: '2026-04-02T17:22:00Z', actorId: 'c-tomas',
    kind: 'claim_submitted',
    claimId: 'cl-hays-shoes',
    sourceRecordId: 'rec-hays-shoes',
    siteId: SITE,
    text: 'The shoe repair at 1114 was there from the late fifties until it shut. The family lived above the shop.',
    sourceLanguage: 'en',
    details: [
      { id: 'el-ha-trade', kind: 'event', value: 'shoe repair', excerpt: 'The shoe repair at 1114' },
      { id: 'el-ha-from', kind: 'date', value: 'late 1950s', excerpt: 'from the late fifties' },
    ],
    sourceType: 'community_oral',
  },

  // Registered again here. Each site's log is folded on its own, so anybody who
  // acts in this log has to be introduced in it. Same id and same details as
  // the registration in `gaskells-lunch-counter`, which is how one person shows
  // up in two places.
  {
    id: 'ha-005', at: '2026-06-17T12:39:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-priya',
    displayName: 'Priya Raghunathan',
  },

  {
    id: 'ha-006', at: '2026-06-17T12:40:00Z', actorId: 'c-priya',
    kind: 'passover_recorded',
    passoverId: 'aff-ha-priya',
    passoverKind: 'sounds_right',
    claimId: 'cl-hays-shoes',
  },
];

export const stateCuts = [
  { stateId: 't0', label: 'Created, one claim', asOf: '2026-04-30T23:59:59Z' },
  { stateId: 't1', label: 'Unchanged', asOf: '2026-05-31T23:59:59Z' },
  { stateId: 't2', label: 'An unrelated contributor agrees', asOf: '2026-06-30T23:59:59Z' },
  { stateId: 't3', label: 'Unchanged', asOf: '2026-07-31T23:59:59Z' },
];
