/**
 * The corner shop is the worked example in docs/HOW-THE-LAYERS-FIT.md. These
 * pin the shape that document describes, so the two cannot drift apart.
 */
import { expect, test } from 'vitest';
import { events, stateCuts } from '../fixtures/corner-shop/events';
import { reduceToStates } from '../src/reduce';

const states = reduceToStates(events, stateCuts);

const state = (id: string) => {
  const s = states.find((st) => st.stateId === id);
  if (!s) throw new Error(`no state ${id}`);
  return s;
};

const claim = (stateId: string, claimId: string) => {
  const c = state(stateId).claims.find((cl) => cl.claim.id === claimId);
  if (!c) throw new Error(`${claimId} not in ${stateId}`);
  return c;
};

test('a record can arrive with nothing claimed about it', () => {
  const t0 = state('t0');
  expect(t0.records.map((r) => r.id)).toEqual(['rec-cs-photo']);
  expect(t0.claims).toHaveLength(0);
});

test('the person who claims is not the person who handed the record over', () => {
  const shop = claim('t1', 'cl-cs-shop');
  expect(shop.sourceRecord.id).toBe('rec-cs-photo');
  expect(shop.sourceRecord.contributorId).toBe('c-june');
  expect(shop.claim.contributorId).toBe('c-ray');
});

test('agreement adds no independent record', () => {
  const shop = claim('t1', 'cl-cs-shop');
  expect(shop.passover.sounds_right).toBe(1);
  expect(shop.independentRecordCount).toBe(0);
  expect(shop.confidence).toBe('single_source');
});

test('the dispute lands on the year and leaves the place and the owner alone', () => {
  const shop = claim('t2', 'cl-cs-shop');
  const disputed = shop.detailStatuses.filter((d) => d.disputes.length > 0).map((d) => d.detail.id);
  expect(disputed).toEqual(['dt-cs-year']);
  const year = shop.detailStatuses.find((d) => d.detail.id === 'dt-cs-year');
  expect(year?.competingValues.map((v) => v.value)).toEqual(['c. 1950', '1956 or later']);
});

test('an extension keeps the conversation source and brings its own record as evidence', () => {
  const uncle = claim('t2', 'cl-cs-uncle');
  expect(uncle.sourceRecord.id).toBe('rec-cs-photo');
  expect(uncle.evidenceRecords.map((r) => r.id)).toEqual(['rec-cs-audio']);
  // That evidence is an independent record for the claim it extends.
  expect(claim('t2', 'cl-cs-shop').independentRecordCount).toBe(1);
});

test('a dispute is a claim of its own, pointed at one detail', () => {
  const shop = claim('t2', 'cl-cs-shop');
  const year = shop.detailStatuses.find((d) => d.detail.id === 'dt-cs-year');
  const edge = year?.disputes[0];
  expect(edge?.fromClaimId).toBe('cl-dsp-cs-year');
  const dispute = claim('t2', 'cl-dsp-cs-year');
  expect(dispute.claim.disputedClaimId).toBe('cl-cs-shop');
  // Same conversation as the claim it disputes, so the same source record.
  expect(dispute.sourceRecord.id).toBe(shop.sourceRecord.id);
  // What it asserts instead is a detail, so it can be disputed or backed in turn.
  expect(dispute.claim.details.map((d) => d.value)).toEqual(['1956 or later']);
});

test('an extension lands on the detail it adds to', () => {
  const shop = claim('t2', 'cl-cs-shop');
  const owner = shop.detailStatuses.find((d) => d.detail.id === 'dt-cs-owner');
  expect(owner?.extensions.map((e) => e.childClaimId)).toEqual(['cl-cs-uncle']);
  const year = shop.detailStatuses.find((d) => d.detail.id === 'dt-cs-year');
  expect(year?.extensions).toEqual([]);
});

test('two unrelated conversations assert the same detail, and nothing links them yet', () => {
  const shop = claim('t3', 'cl-cs-shop');
  const sign = claim('t3', 'cl-cs-sign');
  expect(sign.sourceRecord.id).not.toBe(shop.sourceRecord.id);
  const owner = (c: typeof shop) => c.claim.details.find((d) => d.kind === 'person')?.value;
  expect(owner(sign)).toBe(owner(shop));
  // Matching the two is open (intelligence layer), so neither counts the other.
  expect(sign.independentRecordCount).toBe(0);
});

/* Sections and passages are invented stand-ins (see fixtures/corner-shop/narrative.ts). */

import { narrative } from '../fixtures/corner-shop/narrative';

const withNarrative = reduceToStates(events, stateCuts, narrative);
const page = (id: string) => {
  const s = withNarrative.find((st) => st.stateId === id);
  if (!s) throw new Error(`no state ${id}`);
  return s;
};

test('a photograph with nothing claimed has no passage to write', () => {
  expect(page('t0').sections).toHaveLength(0);
  expect(page('t0').compositions).toHaveLength(0);
});

test('the disputed year reads as a range both readings fit, and leads to the date detail', () => {
  const shop = page('t2').compositions.find((c) => c.sectionId === 'sec-cs-shop');
  const year = shop?.spans.find((s) => s.detailIds?.includes('dt-cs-year'));
  expect(year && shop?.text.slice(year.start, year.end)).toBe('sometime in the 1950s');
});

test('a second conversation becomes a second section, and spans come in both forms', () => {
  const t3 = page('t3');
  expect(t3.sections.map((s) => s.heading)).toEqual(['The shop on the corner', 'The sign']);
  const spans = t3.compositions.flatMap((c) => c.spans);
  expect(spans.some((s) => s.detailIds === undefined)).toBe(true);
  expect(spans.some((s) => s.detailIds !== undefined)).toBe(true);
});
