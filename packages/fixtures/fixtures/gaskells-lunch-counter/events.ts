/**
 * Gaskell's Lunch Counter — contribution event log
 * ================================================
 *
 * A place that closed. Everybody who went there remembers it, nobody agrees on
 * when it shut, and the disagreement is about one date on an otherwise
 * well-supported claim.
 *
 * THIS CONTENT IS INVENTED, including the name of the business. The street
 * address and coordinates are a real corner in Boise. There was no Gaskell's
 * Lunch Counter there and there are no such people. The business name is
 * invented on purpose, so that a fabricated dispute about who owned a place
 * cannot be read onto anybody's actual family or actual shop.
 *
 * WHAT THIS SITE IS FOR
 *
 * The flagship site teaches the model through a community whose vocabulary a
 * reader has to learn first. This one teaches the same structures with a
 * subject nobody needs a glossary for. A lunch counter closed. People
 * disagree about the year.
 *
 * It exercises:
 *
 *   - One record producing several claims. The menu photograph is read three
 *     different ways by three people.
 *   - A dispute landing on one detail while the rest of the claim stands.
 *     The closing year is contested. The address, the owners and the fire are
 *     not.
 *   - Agreement that is not corroboration. Two of the contributors are
 *     siblings who agree with each other, and agreeing adds no source.
 *   - A documentary source arriving late and contradicting the memory that
 *     everybody had agreed on.
 *
 * Authored as an append-only log. States are derived, never authored. See
 * ../../src/reduce.ts.
 */

import type { ContributionEvent } from '../../src/events';

const SITE = 'site-gaskells';

export const events: ContributionEvent[] = [
  /* ================================================================ */
  /* t0 — One person, one photograph, three readings of it.            */
  /* ================================================================ */

  {
    id: 'gk-001', at: '2026-02-03T18:20:00Z', actorId: 'system',
    kind: 'site_created',
    siteId: SITE,
    slug: 'gaskells-lunch-counter',
    name: "Gaskell's Lunch Counter",
    aka: ["Gaskell's", 'the lunch counter', 'the old diner on Ninth'],
    coordinates: [-116.20087, 43.61759],
    address: '9th and Bannock',
    city: 'Boise, Idaho',
  },

  {
    id: 'gk-002', at: '2026-02-03T18:22:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-dolores',
    displayName: 'Dolores Whitcomb',
  },

  {
    id: 'gk-003', at: '2026-02-03T18:41:00Z', actorId: 'c-dolores',
    kind: 'record_submitted',
    recordId: 'rec-menu-photo',
    siteId: SITE,
    note: 'A photograph of the paper menu, taken on the counter. The prices and the hours are legible. The date is not printed anywhere on it.',
    media: [
      {
        mediaId: 'med-menu-photo',
        kind: 'image',
        storageKey: 'records/rec-menu-photo/menu.jpg',
        contentType: 'image/jpeg',
        byteSize: 2_180_400,
        originalFilename: 'menu.jpg',
        processing: 'ready',
        width: 3024,
        height: 4032,
      },
    ],
  },

  {
    id: 'gk-004', at: '2026-02-03T18:44:00Z', actorId: 'c-dolores',
    kind: 'claim_submitted',
    claimId: 'cl-closed-1979',
    sourceRecordId: 'rec-menu-photo',
    siteId: SITE,
    text: "Gaskell's was on the corner of 9th and Bannock and it closed in 1979. My mother took this photograph of the menu on one of the last days it was open. She kept it in the kitchen drawer for the rest of her life.",
    sourceLanguage: 'en',
    details: [
      { id: 'el-gk-year', kind: 'date', value: '1979', excerpt: 'it closed in 1979' },
      { id: 'el-gk-place', kind: 'place', value: '9th and Bannock', excerpt: 'on the corner of 9th and Bannock' },
    ],
    sourceType: 'family_oral',
  },

  /* ================================================================ */
  /* t1 — Her brother agrees. Volume rises, independence does not.     */
  /*      A second person reads the same photograph differently.       */
  /* ================================================================ */

  {
    id: 'gk-005', at: '2026-03-11T14:02:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-raymond',
    displayName: 'Raymond Whitcomb',
  },

  {
    id: 'gk-006', at: '2026-03-11T14:09:00Z', actorId: 'c-raymond',
    kind: 'passover_recorded',
    passoverId: 'aff-gk-ray',
    passoverKind: 'sounds_right',
    claimId: 'cl-closed-1979',
  },

  {
    id: 'gk-007', at: '2026-03-18T20:31:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-priya',
    displayName: 'Priya Raghunathan',
  },

  {
    id: 'gk-008', at: '2026-03-18T20:47:00Z', actorId: 'c-priya',
    kind: 'claim_submitted',
    claimId: 'cl-shift-workers',
    sourceRecordId: 'rec-menu-photo',
    siteId: SITE,
    text: 'The hours on this menu are five in the morning until two in the afternoon. That is a shift pattern, not a lunch trade. Whoever ate here was going to work before dawn.',
    sourceLanguage: 'en',
    details: [
      { id: 'el-gk-hours', kind: 'quantity', value: '05:00 to 14:00', excerpt: 'five in the morning until two in the afternoon' },
    ],
    sourceType: 'documentary',
  },

  {
    id: 'gk-009', at: '2026-03-22T11:15:00Z', actorId: 'c-dolores',
    kind: 'claim_extended',
    claimId: 'cl-mother-worked',
    sourceRecordId: 'rec-menu-photo',
    parentClaimId: 'cl-shift-workers',
    siteId: SITE,
    text: 'That is right, and my mother was one of them. She was on the early shift at the laundry two streets over and she ate here before work most days.',
    sourceLanguage: 'en',
    details: [
      { id: 'el-gk-person', kind: 'person', value: 'Dolores Whitcomb\'s mother', excerpt: 'my mother was one of them' },
    ],
    sourceType: 'family_oral',
  },

  /* ================================================================ */
  /* t2 — Somebody unrelated brings their own record. This is the      */
  /*      first contribution that moves independence rather than       */
  /*      volume.                                                       */
  /* ================================================================ */

  {
    id: 'gk-010', at: '2026-04-14T16:40:00Z', actorId: 'c-priya',
    kind: 'record_submitted',
    recordId: 'rec-boarded-front',
    siteId: SITE,
    note: 'The same corner with the windows boarded. My uncle took it from across the street, he could not say exactly when.',
    media: [
      {
        mediaId: 'med-boarded-front',
        kind: 'image',
        storageKey: 'records/rec-boarded-front/front.jpg',
        contentType: 'image/jpeg',
        byteSize: 1_640_220,
        originalFilename: 'front.jpg',
        processing: 'ready',
        width: 2048,
        height: 1536,
      },
    ],
  },

  {
    id: 'gk-011', at: '2026-04-14T16:52:00Z', actorId: 'c-priya',
    kind: 'passover_recorded',
    passoverId: 'aff-gk-priya',
    passoverKind: 'sounds_right',
    claimId: 'cl-closed-1979',
  },

  {
    id: 'gk-012', at: '2026-04-21T09:05:00Z', actorId: 'c-raymond',
    kind: 'passover_recorded',
    passoverId: 'pv-gk-ray-hours',
    claimId: 'cl-shift-workers',
    passoverKind: 'sounds_right',
  },

  /* ================================================================ */
  /* t3 — A city directory contradicts the year everybody agreed on.   */
  /*      The dispute lands on the date detail only. The address, the */
  /*      hours and the people are untouched.                          */
  /* ================================================================ */

  {
    id: 'gk-013', at: '2026-06-02T13:20:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-arlen',
    displayName: 'Arlen Mbeki',
    institution: 'Boise City Directory project',
  },

  {
    id: 'gk-014', at: '2026-06-02T13:44:00Z', actorId: 'c-arlen',
    kind: 'record_submitted',
    recordId: 'rec-directory-1981',
    siteId: SITE,
    note: 'Scan of the 1981 city directory page. The listing for 9th and Bannock still carries the business name.',
    media: [
      {
        mediaId: 'med-directory-1981',
        kind: 'document',
        storageKey: 'records/rec-directory-1981/page-204.pdf',
        contentType: 'application/pdf',
        byteSize: 4_902_118,
        originalFilename: 'directory-1981-p204.pdf',
        processing: 'ready',
      },
    ],
  },

  {
    id: 'gk-015', at: '2026-06-02T13:51:00Z', actorId: 'c-arlen',
    kind: 'claim_disputed',
    edgeId: 'de-gk-year',
    // A dispute is a claim of its own (contract 2.3.0).
    claimId: 'cl-de-gk-year',
    targetClaimId: 'cl-closed-1979',
    targetDetailId: 'el-gk-year',
    reasoning: 'The 1981 city directory still lists the business at this address. A directory is compiled the year before it is printed, so the business was trading in 1980 at the latest. It did not close in 1979.',
    proposedValue: '1981',
  },

  {
    id: 'gk-016', at: '2026-06-09T19:30:00Z', actorId: 'c-dolores',
    kind: 'passover_recorded',
    passoverId: 'pv-gk-dolores-dispute',
    claimId: 'cl-closed-1979',
    passoverKind: 'dont_know',
  },
];

export const stateCuts = [
  { stateId: 't0', label: 'One photograph, one reading of it', asOf: '2026-02-28T23:59:59Z' },
  { stateId: 't1', label: 'A sibling agrees, and the same record is read again', asOf: '2026-03-31T23:59:59Z' },
  { stateId: 't2', label: 'Somebody unrelated brings a second record', asOf: '2026-05-31T23:59:59Z' },
  { stateId: 't3', label: 'A city directory contests the closing year', asOf: '2026-06-30T23:59:59Z' },
];
