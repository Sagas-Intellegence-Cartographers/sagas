/**
 * The corner shop — contribution event log
 * ========================================
 *
 * The worked example from `docs/HOW-THE-LAYERS-FIT.md`, as data. Read that
 * document first. This log follows it step for step.
 *
 * THIS CONTENT IS INVENTED. The shop, the Ferris family and every contributor
 * are made up. The coordinates are an approximate downtown corner, flagged as
 * approximate. Any resemblance to a real shop or family is unintended.
 *
 * WHAT THIS SITE IS FOR
 *
 *   - A record with no claim. At t0 somebody hands over a photograph and says
 *     they do not know when it was taken. Nothing is claimed.
 *   - Author separation. At t1 a different person reads the photograph and
 *     makes the claim. The person who handed it over asserted nothing.
 *   - A claim made of details, with one detail disputed and the others left
 *     alone (t2).
 *   - Evidence. The extension at t2 brings its own record (an audio clip),
 *     which is attached as evidence while the conversation's source stays the
 *     photograph.
 *   - Agreement that is not a source. The "sounds right" at t1 adds no source.
 *   - An extension landing on one detail. "Mr. Ferris was my uncle" adds to
 *     the owner detail (t2).
 *   - A dispute as a claim of its own, in the same conversation as the claim
 *     it disputes, carrying the directory page it cites as evidence (t2).
 *   - Two unrelated branches asserting the same detail (t3). A second person,
 *     with a different photograph in a different conversation, also names
 *     Mr. Ferris as the owner. Nothing links the two yet. Matching them is an
 *     open question for the intelligence layer.
 *
 * WHAT IT CANNOT SHOW YET
 *
 *   - The question prompts the contributor would attach to the photograph
 *     ("does anyone know the year?"). They are a proposal, not in the contract.
 *
 * Authored as an append-only log. States are derived, never authored. See
 * ../../src/reduce.ts.
 */

import type { ContributionEvent } from '../../src/events';

const SITE = 'site-corner-shop';

export const events: ContributionEvent[] = [
  /* ================================================================ */
  /* t0 — January. A photograph arrives with nothing claimed.          */
  /* ================================================================ */

  {
    id: 'cs-001', at: '2026-01-12T17:00:00Z', actorId: 'system',
    kind: 'site_created',
    siteId: SITE,
    slug: 'corner-shop',
    name: 'The corner shop',
    aka: ["Ferris's", 'the shop on the corner'],
    coordinates: [-116.2016, 43.6149],
    address: 'N 4th St and W Main St',
    city: 'Boise, Idaho',
  },

  {
    id: 'cs-002', at: '2026-01-12T17:01:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-june',
    displayName: 'June Alder',
  },

  {
    id: 'cs-003', at: '2026-01-12T17:14:00Z', actorId: 'c-june',
    kind: 'record_submitted',
    recordId: 'rec-cs-photo',
    siteId: SITE,
    note: "My grandmother's shop, I think. I don't know when this was taken.",
    media: [
      {
        mediaId: 'med-cs-photo',
        kind: 'image',
        storageKey: 'records/rec-cs-photo/shopfront.jpg',
        contentType: 'image/jpeg',
        byteSize: 1_912_004,
        originalFilename: 'shopfront.jpg',
        processing: 'ready',
        width: 2400,
        height: 1600,
      },
    ],
  },

  /* ================================================================ */
  /* t1 — February. Somebody else reads the photograph and claims.     */
  /*      A third person agrees, which adds no source.                 */
  /* ================================================================ */

  {
    id: 'cs-004', at: '2026-02-03T19:20:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-ray',
    displayName: 'Ray Okafor',
  },

  {
    id: 'cs-005', at: '2026-02-03T19:31:00Z', actorId: 'c-ray',
    kind: 'claim_submitted',
    claimId: 'cl-cs-shop',
    sourceRecordId: 'rec-cs-photo',
    siteId: SITE,
    text: "That's the shop on the corner of Fourth and Main, around 1950. The man in the doorway is the owner, Mr. Ferris.",
    sourceLanguage: 'en',
    details: [
      { id: 'dt-cs-place', kind: 'place', value: 'Fourth and Main', excerpt: 'the corner of Fourth and Main' },
      { id: 'dt-cs-year', kind: 'date', value: 'c. 1950', excerpt: 'around 1950' },
      { id: 'dt-cs-owner', kind: 'person', value: 'Ferris', excerpt: 'the owner, Mr. Ferris' },
    ],
    sourceType: 'firsthand',
  },

  {
    id: 'cs-006', at: '2026-02-10T15:02:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-lena',
    displayName: 'Lena Varga',
  },

  {
    id: 'cs-007', at: '2026-02-10T15:05:00Z', actorId: 'c-lena',
    kind: 'passover_recorded',
    passoverId: 'aff-cs-lena',
    passoverKind: 'sounds_right',
    claimId: 'cl-cs-shop',
  },

  /* ================================================================ */
  /* t2 — April. The year is disputed, with a document behind it.      */
  /*      The owner detail is extended with an audio clip as evidence. */
  /* ================================================================ */

  {
    id: 'cs-008', at: '2026-04-06T18:00:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-owen',
    displayName: 'Owen Pike',
  },

  {
    id: 'cs-009', at: '2026-04-06T18:12:00Z', actorId: 'c-owen',
    kind: 'record_submitted',
    recordId: 'rec-cs-directory',
    siteId: SITE,
    note: 'City directory page, 1956 edition. The listing for the corner changes that year, the same year the awning went up.',
    media: [
      {
        mediaId: 'med-cs-directory',
        kind: 'document',
        storageKey: 'records/rec-cs-directory/directory-1956.pdf',
        contentType: 'application/pdf',
        byteSize: 412_880,
        originalFilename: 'directory-1956.pdf',
        processing: 'ready',
      },
    ],
  },

  {
    id: 'cs-010', at: '2026-04-06T18:20:00Z', actorId: 'c-owen',
    kind: 'claim_disputed',
    edgeId: 'dsp-cs-year',
    // A dispute is a claim of its own, so it can carry evidence like any claim:
    // here, the directory page its reasoning cites.
    claimId: 'cl-dsp-cs-year',
    evidenceRecordIds: ['rec-cs-directory'],
    targetClaimId: 'cl-cs-shop',
    targetDetailId: 'dt-cs-year',
    reasoning: "It can't be 1950. The awning in the photo went up in 1956. The directory page I uploaded shows the change.",
    proposedValue: '1956 or later',
  },

  {
    id: 'cs-011', at: '2026-04-19T20:40:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-mae',
    displayName: 'Mae Ferris-Holt',
  },

  {
    id: 'cs-012', at: '2026-04-19T20:44:00Z', actorId: 'c-mae',
    kind: 'record_submitted',
    recordId: 'rec-cs-audio',
    siteId: SITE,
    media: [
      {
        mediaId: 'med-cs-audio',
        kind: 'audio',
        storageKey: 'records/rec-cs-audio/uncle.m4a',
        contentType: 'audio/mp4',
        byteSize: 1_204_311,
        originalFilename: 'uncle.m4a',
        processing: 'ready',
        durationSeconds: 48,
      },
    ],
  },

  {
    id: 'cs-013', at: '2026-04-19T20:51:00Z', actorId: 'c-mae',
    kind: 'claim_extended',
    claimId: 'cl-cs-uncle',
    sourceRecordId: 'rec-cs-photo',
    evidenceRecordIds: ['rec-cs-audio'],
    parentClaimId: 'cl-cs-shop',
    // It adds to who the owner was, so it targets that detail.
    targetDetailId: 'dt-cs-owner',
    siteId: SITE,
    text: 'Mr. Ferris was my uncle. He ran that shop until the sixties.',
    sourceLanguage: 'en',
    details: [
      { id: 'dt-cs-uncle-until', kind: 'date', value: '1960s', excerpt: 'until the sixties' },
    ],
    sourceType: 'family_oral',
  },

  /* ================================================================ */
  /* t3 — June. A second, unrelated conversation names the same owner. */
  /*      Readers pass by.                                             */
  /* ================================================================ */

  {
    id: 'cs-014', at: '2026-06-08T16:10:00Z', actorId: 'system',
    kind: 'contributor_registered',
    contributorId: 'c-dev',
    displayName: 'Dev Castellanos',
  },

  {
    id: 'cs-015', at: '2026-06-08T16:18:00Z', actorId: 'c-dev',
    kind: 'record_submitted',
    recordId: 'rec-cs-sign',
    siteId: SITE,
    note: 'The hand-painted sign from above the door, photographed in my garage. It came with the house.',
    media: [
      {
        mediaId: 'med-cs-sign',
        kind: 'image',
        storageKey: 'records/rec-cs-sign/sign.jpg',
        contentType: 'image/jpeg',
        byteSize: 2_310_775,
        originalFilename: 'sign.jpg',
        processing: 'ready',
        width: 4032,
        height: 1512,
      },
    ],
  },

  {
    id: 'cs-016', at: '2026-06-08T16:26:00Z', actorId: 'c-dev',
    kind: 'claim_submitted',
    claimId: 'cl-cs-sign',
    sourceRecordId: 'rec-cs-sign',
    siteId: SITE,
    text: "The sign reads FERRIS GROCERY. The previous owner of my house said it came down when the shop closed.",
    sourceLanguage: 'en',
    details: [
      { id: 'dt-cs-sign-owner', kind: 'person', value: 'Ferris', excerpt: 'FERRIS GROCERY' },
      { id: 'dt-cs-sign-trade', kind: 'event', value: 'grocery', excerpt: 'GROCERY' },
    ],
    sourceType: 'documentary',
  },

  {
    id: 'cs-017', at: '2026-06-15T13:02:00Z', actorId: 'c-lena',
    kind: 'passover_recorded',
    passoverId: 'pv-cs-lena-sign',
    claimId: 'cl-cs-sign',
    passoverKind: 'dont_know',
  },

  {
    id: 'cs-018', at: '2026-06-15T13:05:00Z', actorId: 'c-ray',
    kind: 'passover_recorded',
    passoverId: 'pv-cs-ray-uncle',
    claimId: 'cl-cs-uncle',
    passoverKind: 'sounds_right',
  },
];

export const stateCuts = [
  { stateId: 't0', label: 'A photograph, nothing claimed', asOf: '2026-01-31T23:59:59Z' },
  { stateId: 't1', label: 'Somebody else reads it; agreement adds no source', asOf: '2026-02-28T23:59:59Z' },
  { stateId: 't2', label: 'The year is disputed; the owner is extended with evidence', asOf: '2026-04-30T23:59:59Z' },
  { stateId: 't3', label: 'A second conversation names the same owner', asOf: '2026-06-30T23:59:59Z' },
];
