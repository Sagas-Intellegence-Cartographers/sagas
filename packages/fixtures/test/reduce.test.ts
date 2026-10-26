import { expect, test } from 'vitest';
import { events, stateCuts } from '../fixtures/freight-depot/events';
import { reduceToStates } from '../src/reduce';

const states = reduceToStates(events, stateCuts);
const [t0, t1, t2, t3] = states as [
  (typeof states)[number],
  (typeof states)[number],
  (typeof states)[number],
  (typeof states)[number],
];

const find = (s: typeof t0, id: string) => s.claims.find((c) => c.claim.id === id)!;
const termNames = (s: typeof t0, id: string) => find(s, id).score.terms.map((t) => t.name);

test('nothing is ever removed: claim counts are monotonic', () => {
  const counts = [t0, t1, t2, t3].map((s) => s.claims.length);
  for (let i = 1; i < counts.length; i++) expect(counts[i]!).toBeGreaterThanOrEqual(counts[i - 1]!);
  const ids = [t0, t1, t2, t3].map((s) => new Set(s.claims.map((c) => c.claim.id)));
  for (let i = 1; i < ids.length; i++) {
    for (const id of ids[i - 1]!) expect(ids[i]!.has(id), `${id} disappeared`).toBe(true);
  }
});

test('agreement is never independent support', () => {
  const dock = find(t3, 'cl-fd-dock');
  expect(dock.passover.sounds_right).toBe(1);
  expect(dock.independentRecordCount).toBe(0);
  expect(dock.confidence).toBe('single_source');
});

test('a record somebody else brings is an independent record', () => {
  // Pau backs the office claim with a web page of their own.
  expect(find(t1, 'cl-fd-office').independentRecordCount).toBe(0);
  expect(find(t2, 'cl-fd-office').independentRecordCount).toBe(1);
});

test('an untranslated claim is present and readable, and its content terms wait', () => {
  const before = find(t1, 'cl-fd-ines');
  expect(before.claim.awaitingTranslation).toBe(true);
  expect(before.claim.sourceLanguageText).toBeTruthy();
  expect(before.claim.sourceLanguage).toBe('fr');
  expect(termNames(t1, 'cl-fd-ines')).not.toContain('extensions');

  const after = find(t2, 'cl-fd-ines');
  expect(after.claim.awaitingTranslation).toBe(false);
  expect(after.claim.sourceLanguageText).toBe(before.claim.sourceLanguageText);
  expect(termNames(t2, 'cl-fd-ines')).toContain('extensions');
});

test('a claim citing a window of a recording waits for that window to be transcribed', () => {
  const ines = find(t2, 'cl-fd-ines');
  expect(ines.claim.sourceWindow).toEqual({ start: 18, end: 70 });
  const transcript = t2.transcripts.find((t) => t.recordId === 'rec-fd-04');
  expect(transcript?.window).toEqual({ start: 18, end: 70 });
});

test('a recording is published without waiting for a transcript', () => {
  const recording = t1.records.find((r) => r.id === 'rec-fd-04');
  expect(recording?.submission).toBe('published');
  expect(t1.transcripts).toHaveLength(0);
});

test('a translated claim never scores lower for being translated', () => {
  const ines = find(t3, 'cl-fd-ines');
  const termsFromTranslation = ines.score.terms.filter((t) => /translat|language/i.test(t.name));
  expect(termsFromTranslation).toHaveLength(0);
});

test('competing renderings coexist; neither replaces the other', () => {
  const ines = find(t3, 'cl-fd-ines');
  expect(ines.translations).toHaveLength(2);
  expect(new Set(ines.translations.map((t) => t.contributorId)).size).toBe(2);
  expect(ines.translationDisputes).toHaveLength(1);
});

test('a dispute targets one detail and leaves the rest of the claim alone', () => {
  const office = find(t3, 'cl-fd-office');
  const contested = office.detailStatuses.filter((e) => e.disputes.length > 0);
  expect(contested).toHaveLength(1);
  expect(contested[0]!.detail.kind).toBe('date');
  expect(office.detailStatuses.some((e) => e.disputes.length === 0 && e.detail.kind === 'person')).toBe(true);
});

test('competing readings are all kept, in the order they arrived', () => {
  const year = find(t3, 'cl-fd-office').detailStatuses.find((e) => e.detail.kind === 'date')!;
  const values = year.competingValues.map((v) => v.value);
  expect(values[0]).toBe(year.detail.value);
  expect(values).toEqual(expect.arrayContaining(['1931', '1934']));
});

test('scores come in the scorer\'s shape, with a score for every detail', () => {
  for (const c of t3.claims) {
    expect(c.weight).toBe(c.score.score);
    expect(c.score.details.map((d) => d.detailId)).toEqual(c.claim.details.map((d) => d.id));
    for (const ds of c.detailStatuses) {
      expect(ds.weight).toBe(c.score.details.find((d) => d.detailId === ds.detail.id)?.score);
    }
  }
});

test('the stand-in has no source-type tiers', () => {
  for (const c of t3.claims) {
    expect(c.score.terms.some((t) => /source type|tier/i.test(t.name))).toBe(false);
  }
});

test('claims are ordered by weight, and disputed claims are not hidden', () => {
  for (const s of [t0, t1, t2, t3]) {
    const weights = s.claims.map((c) => c.weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  }
  expect(t3.claims.some((c) => c.confidence === 'contested')).toBe(true);
});

test('a link is a record with no files', () => {
  const link = t2.records.find((r) => r.id === 'rec-fd-07');
  expect(link?.link?.url).toMatch(/^https:\/\//);
  expect(link?.media).toHaveLength(0);
});

test('a collection keeps the records handed over together', () => {
  const col = t3.collections.find((c) => c.id === 'col-fd-luis');
  expect(col?.recordIds).toEqual(['rec-fd-03', 'rec-fd-08']);
  expect(col?.contributorId).toBe('c-luis');
  expect(col?.note).toBeTruthy();
});

test('every state knows which contributions produced it', () => {
  const prior = new Set(t2.eventIdsApplied);
  for (const id of t3.eventIdsSincePrevious) expect(prior.has(id)).toBe(false);
  expect(t3.eventIdsApplied).toHaveLength(t2.eventIdsApplied.length + t3.eventIdsSincePrevious.length);
});

test('integrity rises as the record fills in', () => {
  const scores = [t0, t1, t2, t3].map((s) => s.integrity.overall);
  for (let i = 1; i < scores.length; i++) expect(scores[i]!).toBeGreaterThan(scores[i - 1]!);
  expect(t0.integrity.overall).toBeLessThan(30);
  expect(t3.integrity.overall).toBeGreaterThan(70);
});
