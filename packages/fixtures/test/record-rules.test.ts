/**
 * One record is one artifact (contract 2.2.0). These pin the rules a record
 * follows, the shape a record has when it arrives without an id, and the
 * choices and links added in 2.4.0.
 */
import { describe, expect, it } from 'vitest';
import { claim, collection, newSourceRecord, sourceRecord, timeWindow } from '@sagas/contracts';
import type { MediaRef } from '@sagas/contracts';

const written = {
  id: 'rec-1',
  siteId: 'site-001',
  contributorId: 'guest-abc',
  text: 'My great-grandmother cooked in the boarding house kitchen.',
  submission: 'submitted' as const,
  media: [] as MediaRef[],
  choices: {
    rightToShare: true as const,
    studentAccess: false,
    public: 'later' as const,
    location: 'remove' as const,
    mentionsPeople: 'not_sure' as const,
  },
  termsVersion: 'provisional-0.1',
  createdAt: '2026-10-16T16:00:00Z',
};

const file = (id: string, kind: MediaRef['kind']): MediaRef => ({
  id,
  recordId: 'rec-1',
  kind,
  storageKey: `uploads/${id}`,
  contentType: kind === 'image' ? 'image/jpeg' : 'application/octet-stream',
  byteSize: 1000,
  processing: 'ready',
  derivatives: [],
  createdAt: '2026-10-16T16:00:00Z',
});

describe('one record is one artifact', () => {
  it('accepts a written record with an empty media list', () => {
    expect(sourceRecord.safeParse(written).success).toBe(true);
  });

  it('accepts several files of one kind, like the pages of a scanned letter', () => {
    const letter = { ...written, text: undefined, note: 'A letter from 1952.', media: [file('p1', 'image'), file('p2', 'image')] };
    expect(sourceRecord.safeParse(letter).success).toBe(true);
  });

  it('refuses files of different kinds in one record', () => {
    const mixed = { ...written, note: 'A photo and a recording.', media: [file('a', 'image'), file('b', 'audio')] };
    const result = sourceRecord.safeParse(mixed);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/same kind/);
  });

  it('still needs a note on an image', () => {
    const photo = { ...written, text: undefined, media: [file('p1', 'image')] };
    expect(sourceRecord.safeParse(photo).success).toBe(false);
  });
});

describe('a record as it arrives', () => {
  it('needs no id, because whoever stores it decides the id', () => {
    const { id: _id, ...arriving } = written;
    expect(newSourceRecord.safeParse(arriving).success).toBe(true);
  });

  it('follows the same rules as a stored record', () => {
    const { id: _id, ...arriving } = written;
    expect(newSourceRecord.safeParse({ ...arriving, text: undefined }).success).toBe(false);
  });
});

describe('choices and terms (2.4.0)', () => {
  it('needs the contributor\'s choices and the terms version', () => {
    const { choices: _c, ...noChoices } = written;
    expect(sourceRecord.safeParse(noChoices).success).toBe(false);
    const { termsVersion: _t, ...noTerms } = written;
    expect(sourceRecord.safeParse(noTerms).success).toBe(false);
  });

  it('needs the right to share', () => {
    const notTheirs = { ...written, choices: { ...written.choices, rightToShare: false } };
    expect(sourceRecord.safeParse(notTheirs).success).toBe(false);
  });
});

describe('a link is a record (2.4.0)', () => {
  const page = { ...written, text: undefined, note: 'A newspaper notice.', link: { url: 'https://example.org/notice' } };

  it('accepts a web page with no files', () => {
    expect(sourceRecord.safeParse(page).success).toBe(true);
  });

  it('refuses a link with files, since a page is its own record', () => {
    expect(sourceRecord.safeParse({ ...page, media: [file('p1', 'image')] }).success).toBe(false);
  });

  it('refuses an address that is not a URL', () => {
    expect(sourceRecord.safeParse({ ...page, link: { url: 'not a url' } }).success).toBe(false);
  });
});

describe('time windows and collections (2.4.0)', () => {
  it('a window has to start before it ends', () => {
    expect(timeWindow.safeParse({ start: 18, end: 70 }).success).toBe(true);
    expect(timeWindow.safeParse({ start: 70, end: 18 }).success).toBe(false);
  });

  it('a claim can cite a window of its source', () => {
    const shape = claim.shape.sourceWindow;
    expect(shape.safeParse({ start: 2100, end: 2230 }).success).toBe(true);
    expect(shape.safeParse(undefined).success).toBe(true);
  });

  it('a collection holds at least one record and belongs to a profile', () => {
    const base = { id: 'col-1', contributorId: 'guest-abc', createdAt: '2026-10-16T16:00:00Z' };
    expect(collection.safeParse({ ...base, recordIds: ['rec-1', 'rec-2'] }).success).toBe(true);
    expect(collection.safeParse({ ...base, recordIds: [] }).success).toBe(false);
  });
});
