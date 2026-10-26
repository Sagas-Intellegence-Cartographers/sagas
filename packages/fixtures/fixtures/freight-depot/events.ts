/**
 * The freight depot — contribution event log
 * ==========================================
 *
 * The long fixture: translations, renderings, a recording transcribed a time
 * window at a time, a photo whose embedded location disagrees with the place,
 * an upload still processing, an open report, a link handed over as a source,
 * and a collection of photographs handed over together.
 *
 * THIS CONTENT IS INVENTED. The depot, its address, every contributor and
 * every remembered event are made up to exercise the data model. The
 * coordinates are an approximate point downtown, chosen so the pin sits near
 * the other fixture sites, and mark no real building. It represents
 * no real building, family or community. The French is simple sample text.
 *
 * Authored as an append-only log. States are derived, never authored. See
 * ../../src/reduce.ts.
 */

import type { ContributionEvent } from '../../src/events';

const SITE = 'site-freight-depot';

export const events: ContributionEvent[] = [
  /* ================================================================ */
  /* t0 — January. One contributor, nothing corroborated.              */
  /* ================================================================ */

  {
    id: 'fd-001', at: '2026-01-06T15:00:00Z', actorId: 'system',
    kind: 'site_created',
    siteId: SITE,
    slug: 'freight-depot',
    name: 'The Freight Depot',
    aka: ['the depot', 'the old warehouse'],
    coordinates: [-116.2089, 43.6141],
    address: '1 Depot Row (invented)',
    city: 'Boise, Idaho',
  },
  {
    id: 'fd-002', at: '2026-01-06T15:02:00Z', actorId: 'system',
    kind: 'contributor_registered', contributorId: 'c-ana', displayName: 'Ana (invented)',
  },
  {
    id: 'fd-003', at: '2026-01-06T15:20:00Z', actorId: 'c-ana',
    kind: 'record_submitted',
    recordId: 'rec-fd-01',
    siteId: SITE,
    // A written record with no files, the most common contribution. Two claims
    // come out of it, which is why records and claims are separate things.
    text:
      'Two things I know about the depot from my grandfather, who worked there: the office at the ' +
      'front, and the loading dock along the tracks.',
    language: 'en',
    submission: 'published',
  },
  {
    id: 'fd-004', at: '2026-01-06T15:22:00Z', actorId: 'c-ana',
    kind: 'claim_submitted',
    claimId: 'cl-fd-office',
    sourceRecordId: 'rec-fd-01',
    siteId: SITE,
    sourceLanguage: 'en',
    text: 'The depot office opened in 1931, and my grandfather was a clerk there from the start.',
    details: [
      { id: 'cl-fd-office-year', kind: 'date', value: '1931', excerpt: 'opened in 1931' },
      { id: 'cl-fd-office-person', kind: 'person', value: 'grandfather, clerk', excerpt: 'my grandfather was a clerk' },
    ],
    sourceType: 'family_oral',
  },
  {
    id: 'fd-005', at: '2026-01-06T15:30:00Z', actorId: 'c-ana',
    kind: 'claim_submitted',
    claimId: 'cl-fd-dock',
    sourceRecordId: 'rec-fd-01',
    siteId: SITE,
    sourceLanguage: 'en',
    text: 'The loading dock ran the length of the tracks, and in winter they kept a stove going on it.',
    details: [
      { id: 'cl-fd-dock-place', kind: 'place', value: 'along the tracks', excerpt: 'ran the length of the tracks' },
      { id: 'cl-fd-dock-season', kind: 'event', value: 'stove in winter', excerpt: 'in winter they kept a stove going' },
    ],
    sourceType: 'family_oral',
  },
  {
    id: 'fd-006', at: '2026-01-07T02:00:00Z', actorId: 'c-ana',
    kind: 'record_submitted',
    recordId: 'rec-fd-02',
    siteId: SITE,
    text: 'One more thing, about what was on the lot before the depot.',
    language: 'en',
    submission: 'published',
  },
  {
    id: 'fd-007', at: '2026-01-07T02:05:00Z', actorId: 'c-ana',
    kind: 'claim_submitted',
    claimId: 'cl-fd-prelot',
    sourceRecordId: 'rec-fd-02',
    siteId: SITE,
    sourceLanguage: 'en',
    text: 'Before the depot there was a lumber yard on that lot, or so I was told.',
    details: [
      { id: 'cl-fd-prelot-use', kind: 'event', value: 'lumber yard', excerpt: 'a lumber yard on that lot' },
    ],
    sourceType: 'family_oral',
  },

  /* ================================================================ */
  /* t1 — February. A photo, a recording in French, a dispute.         */
  /* ================================================================ */

  {
    id: 'fd-010', at: '2026-02-03T17:00:00Z', actorId: 'system',
    kind: 'contributor_registered', contributorId: 'c-luis', displayName: 'Luis (invented)',
  },
  {
    id: 'fd-011', at: '2026-02-03T17:10:00Z', actorId: 'c-luis',
    kind: 'record_submitted',
    recordId: 'rec-fd-03',
    siteId: SITE,
    note: 'The depot office, about 1935. My uncle is the one by the door.',
    // The photo's GPS puts the camera across the street, 55 metres away and
    // good to about 65. That is the camera's position, not what the photo is of.
    capturedLocation: { coordinates: [-116.2094, 43.6145], method: 'embedded', accuracyMetres: 65 },
    media: [{
      mediaId: 'med-fd-03', kind: 'image', storageKey: 'records/rec-fd-03/med-fd-03/office.jpg',
      contentType: 'image/jpeg', byteSize: 2_310_000, width: 3024, height: 2016, processing: 'ready',
    }],
    // Handed over with rec-fd-08 as one collection.
    collectionId: 'col-fd-luis',
    collectionNote: 'Two photos from my uncle\'s album, kept because he worked there.',
    submission: 'published',
  },
  {
    id: 'fd-012', at: '2026-02-03T17:20:00Z', actorId: 'c-luis',
    kind: 'claim_submitted',
    claimId: 'cl-fd-photo',
    sourceRecordId: 'rec-fd-03',
    siteId: SITE,
    sourceLanguage: 'en',
    text: 'This photo shows the depot office in 1935, with my uncle standing by the door.',
    details: [
      { id: 'cl-fd-photo-year', kind: 'date', value: '1935', excerpt: 'in 1935' },
      { id: 'cl-fd-photo-person', kind: 'person', value: 'uncle by the door', excerpt: 'my uncle standing by the door' },
    ],
    sourceType: 'firsthand',
  },
  {
    id: 'fd-013', at: '2026-02-05T18:00:00Z', actorId: 'c-luis',
    kind: 'claim_disputed',
    edgeId: 'dsp-fd-office-year',
    claimId: 'cl-dsp-fd-office-year',
    targetClaimId: 'cl-fd-office',
    targetDetailId: 'cl-fd-office-year',
    reasoning: 'My uncle always said the office opened in 1934, the year he started, and he was one of the first.',
    proposedValue: '1934',
  },
  {
    id: 'fd-014', at: '2026-02-10T19:00:00Z', actorId: 'system',
    kind: 'contributor_registered', contributorId: 'c-ines', displayName: 'Inès (invented)',
  },
  {
    id: 'fd-015', at: '2026-02-10T19:10:00Z', actorId: 'c-ines',
    kind: 'record_submitted',
    recordId: 'rec-fd-04',
    siteId: SITE,
    note: 'Mon grand-père parle du dépôt.',
    language: 'fr',
    // A recording is published on submission. It doesn't wait for a
    // transcript; transcripts arrive later, a time window at a time.
    media: [{
      mediaId: 'med-fd-04', kind: 'audio', storageKey: 'records/rec-fd-04/med-fd-04/grand-pere.m4a',
      contentType: 'audio/mp4', byteSize: 28_400_000, durationSeconds: 1800, processing: 'ready',
    }],
    submission: 'published',
  },
  {
    id: 'fd-016', at: '2026-02-10T19:20:00Z', actorId: 'c-ines',
    kind: 'claim_submitted',
    claimId: 'cl-fd-ines',
    sourceRecordId: 'rec-fd-04',
    siteId: SITE,
    sourceLanguage: 'fr',
    sourceLanguageText: 'Mon grand-père travaillait au quai. Pour nous, le dépôt était un lieu de travail, pas une gare.',
    text: '',
    awaitingTranslation: true,
    // The claim comes from 0:18 to 1:10 of a thirty-minute recording.
    sourceWindow: { start: 18, end: 70 },
    details: [],
    sourceType: 'family_oral',
  },
  {
    id: 'fd-017', at: '2026-02-12T16:00:00Z', actorId: 'c-ana',
    kind: 'passover_recorded', passoverId: 'pv-fd-01', claimId: 'cl-fd-photo', passoverKind: 'sounds_right',
  },
  {
    id: 'fd-018', at: '2026-02-12T16:02:00Z', actorId: 'c-ana',
    kind: 'passover_recorded', passoverId: 'pv-fd-02', claimId: 'cl-fd-ines', passoverKind: 'dont_know',
  },

  /* ================================================================ */
  /* t2 — March. A rendering arrives; part of the recording is         */
  /* transcribed; a link backs an extension.                           */
  /* ================================================================ */

  {
    id: 'fd-020', at: '2026-03-02T17:00:00Z', actorId: 'system',
    kind: 'contributor_registered', contributorId: 'c-mara', displayName: 'Mara (invented)',
  },
  {
    id: 'fd-021', at: '2026-03-02T17:15:00Z', actorId: 'c-mara',
    kind: 'translation_submitted',
    translationId: 'tl-fd-01',
    claimId: 'cl-fd-ines',
    targetLanguage: 'en',
    text: 'My grandfather worked on the dock. For us the depot was a workplace, not a station.',
  },
  {
    id: 'fd-022', at: '2026-03-04T18:00:00Z', actorId: 'c-ines',
    kind: 'transcript_submitted',
    transcriptId: 'ts-fd-01',
    recordId: 'rec-fd-04',
    language: 'fr',
    // What was said, in the language it was said in, for one window only.
    // Not a translation and not a claim.
    text: 'Mon grand-père travaillait au quai. Pour nous, le dépôt était un lieu de travail, pas une gare.',
    method: 'human',
    window: { start: 18, end: 70 },
  },
  {
    id: 'fd-023', at: '2026-03-08T20:00:00Z', actorId: 'system',
    kind: 'contributor_registered', contributorId: 'c-pau', displayName: 'Pau (invented)',
  },
  {
    id: 'fd-024', at: '2026-03-08T20:10:00Z', actorId: 'c-pau',
    kind: 'record_submitted',
    recordId: 'rec-fd-07',
    siteId: SITE,
    note: 'A newspaper notice about the depot office opening.',
    // A web page handed over as a source. Its domain says nothing about whether
    // it supports the claim; independent people relying on it does.
    link: { url: 'https://example.org/archive/depot-office-notice', title: 'Depot office opens (invented)', seenAt: '2026-03-08T20:05:00Z' },
    submission: 'published',
  },
  {
    id: 'fd-025', at: '2026-03-08T20:20:00Z', actorId: 'c-pau',
    kind: 'claim_extended',
    claimId: 'cl-fd-office-notice',
    sourceRecordId: 'rec-fd-01',
    evidenceRecordIds: ['rec-fd-07'],
    parentClaimId: 'cl-fd-office',
    targetDetailId: 'cl-fd-office-person',
    siteId: SITE,
    sourceLanguage: 'en',
    text: 'The notice lists the first clerks hired for the office.',
    details: [
      { id: 'cl-fd-office-notice-list', kind: 'person', value: 'first clerks listed', excerpt: 'lists the first clerks' },
    ],
    sourceType: 'documentary',
  },

  /* ================================================================ */
  /* t3 — April. Competing renderings, a reconciliation candidate, an  */
  /* upload still processing, an open report, a contributor who        */
  /* authors nothing.                                                  */
  /* ================================================================ */

  {
    id: 'fd-030', at: '2026-04-01T16:00:00Z', actorId: 'c-pau',
    kind: 'translation_submitted',
    translationId: 'tl-fd-02',
    claimId: 'cl-fd-ines',
    targetLanguage: 'en',
    text: 'My grandfather worked at the platform. To us the depot was where people worked, not a railway station.',
  },
  {
    id: 'fd-031', at: '2026-04-02T17:00:00Z', actorId: 'system',
    kind: 'contributor_registered', contributorId: 'c-rob', displayName: 'Rob (invented)',
  },
  {
    id: 'fd-032', at: '2026-04-02T17:10:00Z', actorId: 'c-rob',
    kind: 'translation_disputed',
    disputeId: 'tdis-fd-01',
    translationId: 'tl-fd-01',
    reasoning: '"Quai" here is the platform along the tracks, not a dock on water. The first rendering suggests a harbour.',
  },
  {
    id: 'fd-033', at: '2026-04-05T18:00:00Z', actorId: 'c-mara',
    kind: 'record_submitted',
    recordId: 'rec-fd-05',
    siteId: SITE,
    text: 'I think both dates people give for the office can be right.',
    language: 'en',
    submission: 'published',
  },
  {
    id: 'fd-034', at: '2026-04-05T18:05:00Z', actorId: 'c-mara',
    kind: 'claim_submitted',
    claimId: 'cl-fd-both',
    sourceRecordId: 'rec-fd-05',
    siteId: SITE,
    sourceLanguage: 'en',
    // Suggests the competing readings were both true. The dispute still stands:
    // nothing here settles it.
    text: 'The office may have opened in 1931 in a back room and moved to the front in 1934.',
    details: [
      { id: 'cl-fd-both-first', kind: 'date', value: '1931', excerpt: 'opened in 1931 in a back room' },
      { id: 'cl-fd-both-second', kind: 'date', value: '1934', excerpt: 'moved to the front in 1934' },
    ],
    sourceType: 'community_oral',
  },
  {
    id: 'fd-035', at: '2026-04-08T19:00:00Z', actorId: 'c-luis',
    kind: 'record_submitted',
    recordId: 'rec-fd-08',
    siteId: SITE,
    note: 'The loading dock, from the same album.',
    media: [{
      mediaId: 'med-fd-08', kind: 'image', storageKey: 'records/rec-fd-08/med-fd-08/dock.jpg',
      contentType: 'image/jpeg', byteSize: 1_980_000, width: 2800, height: 1900, processing: 'ready',
    }],
    collectionId: 'col-fd-luis',
    submission: 'published',
  },
  {
    id: 'fd-036', at: '2026-04-10T20:00:00Z', actorId: 'c-ana',
    kind: 'record_submitted',
    recordId: 'rec-fd-06',
    siteId: SITE,
    note: 'Video of the dock before they tore the roof off.',
    // A large upload still being processed. The record is readable without it.
    media: [{
      mediaId: 'med-fd-06', kind: 'video', storageKey: 'records/rec-fd-06/med-fd-06/dock.mov',
      contentType: 'video/quicktime', byteSize: 604_000_000, processing: 'processing',
    }],
    submission: 'published',
  },
  {
    id: 'fd-037', at: '2026-04-12T16:00:00Z', actorId: 'c-rob',
    kind: 'record_flagged',
    flagId: 'fl-fd-01',
    recordId: 'rec-fd-04',
    reason: 'not_mine_to_share',
    reasoning: 'There is a second voice on this recording from about 3:10. She did not know it was being kept, and someone should ask her.',
  },
  {
    id: 'fd-038', at: '2026-04-14T17:00:00Z', actorId: 'c-rob',
    kind: 'claim_disputed',
    edgeId: 'dsp-fd-photo-year',
    claimId: 'cl-dsp-fd-photo-year',
    targetClaimId: 'cl-fd-photo',
    targetDetailId: 'cl-fd-photo-year',
    reasoning: 'The sign on the door in the photo is the one put up in 1938, so the photo is from 1938 or later.',
    proposedValue: '1938 or later',
  },
  {
    id: 'fd-039', at: '2026-04-15T17:00:00Z', actorId: 'c-rob',
    kind: 'claim_disputed',
    edgeId: 'dsp-fd-prelot',
    claimId: 'cl-dsp-fd-prelot',
    targetClaimId: 'cl-fd-prelot',
    targetDetailId: 'cl-fd-prelot-use',
    reasoning: 'The lot was a coal yard, not a lumber yard. The coal chutes are still under the dock.',
    proposedValue: 'coal yard',
  },
  {
    id: 'fd-040', at: '2026-04-16T15:00:00Z', actorId: 'c-rob',
    kind: 'passover_recorded', passoverId: 'pv-fd-03', claimId: 'cl-fd-both', passoverKind: 'sounds_right',
  },
  {
    id: 'fd-041', at: '2026-04-16T15:02:00Z', actorId: 'c-rob',
    kind: 'passover_recorded', passoverId: 'pv-fd-04', claimId: 'cl-fd-dock', passoverKind: 'sounds_right',
  },
  {
    id: 'fd-042', at: '2026-04-16T15:04:00Z', actorId: 'c-mara',
    kind: 'passover_recorded', passoverId: 'pv-fd-05', claimId: 'cl-fd-office', passoverKind: 'dont_care',
  },
  {
    id: 'fd-043', at: '2026-04-16T15:06:00Z', actorId: 'c-pau',
    kind: 'passover_recorded', passoverId: 'pv-fd-06', claimId: 'cl-fd-photo', passoverKind: 'sounds_right',
  },
];

/** The four instants states are cut at. Labels are shown in the version timeline. */
export const stateCuts = [
  { stateId: 't0', label: 'One contributor, nothing corroborated', asOf: '2026-01-31T23:59:59Z' },
  { stateId: 't1', label: 'A photo, an unrendered recording, a dispute', asOf: '2026-02-28T23:59:59Z' },
  { stateId: 't2', label: 'A rendering arrives; part of a recording is transcribed', asOf: '2026-03-31T23:59:59Z' },
  { stateId: 't3', label: 'Competing renderings, a reconciliation candidate, an open report', asOf: '2026-04-30T23:59:59Z' },
];
