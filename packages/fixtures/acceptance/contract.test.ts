/**
 * Runs the fixture data against the contract.
 *
 * This is the half of the acceptance criteria a machine can check today, before either layer
 * exists: it proves the fixtures actually satisfy the shapes in
 * @sagas/contracts, and that every acceptance criterion points at data that really
 * exhibits the situation it claims to.
 *
 * The other half is yours. Import ACCEPTANCE_CRITERIA into your own test file,
 * feed each case's state through your renderer or your API, and assert the
 * requirement holds. That is the part that catches your bugs; this part only
 * catches ours.
 */

import { describe, expect, it } from 'vitest';
import { graphState } from '@sagas/contracts';
import { ACCEPTANCE_CRITERIA, loadAllStates, loadSiteState } from './index';

const states = loadAllStates();

describe('fixtures satisfy the contract', () => {
  it.each(states.map((s) => [`${s.site.slug} ${s.stateId}`, s] as const))('%s parses', (_id, state) => {
    expect(() => graphState.parse(state)).not.toThrow();
  });

  it('every claim traces to a contributor present in the state', () => {
    for (const state of states) {
      const known = new Set(state.contributors.map((c) => c.id));
      for (const c of state.claims) expect(known.has(c.claim.contributorId)).toBe(true);
    }
  });

  it('every contributor is flagged fictional', () => {
    for (const state of states) {
      for (const c of state.contributors) expect(c.fictional).toBe(true);
    }
  });

  it('every dispute carries reasoning', () => {
    for (const state of states) {
      for (const c of state.claims) {
        for (const es of c.detailStatuses) {
          for (const d of es.disputes) expect(d.reasoning.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('a dispute targets a detail that exists on the claim it targets', () => {
    for (const state of states) {
      for (const c of state.claims) {
        const detailIds = new Set(c.claim.details.map((e) => e.id));
        for (const es of c.detailStatuses) {
          for (const d of es.disputes) {
            expect(d.targetClaimId).toBe(c.claim.id);
            expect(detailIds.has(d.targetDetailId)).toBe(true);
          }
        }
      }
    }
  });

  it('claims awaiting translation keep their original, and their content terms wait', () => {
    for (const state of states) {
      for (const c of state.claims.filter((c) => c.claim.awaitingTranslation)) {
        expect(c.claim.sourceLanguageText).toBeTruthy();
        expect(c.claim.sourceLanguage).not.toBe('en');
        // What depends on the claim's own content isn't counted until it's
        // rendered. What it gets from evidence and behaviour still counts.
        expect(c.score.terms.some((t) => t.name === 'extensions')).toBe(false);
      }
    }
  });
});

describe('acceptance criteria point at data that exhibits them', () => {
  it.each(ACCEPTANCE_CRITERIA.map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const state = loadSiteState(c.site, c.stateId);
    expect(state).toBeTruthy();
    if (c.subject) {
      // A case can be about a claim, the record it came from, or a person.
      const subject =
        state.claims.find((cl) => cl.claim.id === c.subject) ??
        state.records.find((r) => r.id === c.subject) ??
        state.collections.find((col) => col.id === c.subject) ??
        state.contributors.find((p) => p.id === c.subject);
      expect(subject, `${c.subject} not present in ${c.site} ${c.stateId}`).toBeTruthy();
    }
  });

  it('the affirmation-without-independence case really has that shape', () => {
    const shop = loadSiteState('corner-shop', 't1').claims.find((c) => c.claim.id === 'cl-cs-shop');
    expect(shop?.passover.sounds_right).toBeGreaterThan(0);
    expect(shop?.independentRecordCount).toBe(0);
    expect(shop?.confidence).toBe('single_source');
  });

  it('the granular dispute case leaves other details alone', () => {
    const shop = loadSiteState('corner-shop', 't2').claims.find((c) => c.claim.id === 'cl-cs-shop');
    const contested = shop?.detailStatuses.filter((e) => e.disputes.length > 0) ?? [];
    const clean = shop?.detailStatuses.filter((e) => e.disputes.length === 0) ?? [];
    expect(contested).toHaveLength(1);
    expect(clean.length).toBeGreaterThan(0);
  });

  it('every claim points at a record that exists in the same state', () => {
    for (const state of states) {
      const known = new Set(state.records.map((r) => r.id));
      for (const c of state.claims) {
        expect(known.has(c.claim.sourceRecordId), `${c.claim.id} -> ${c.claim.sourceRecordId}`).toBe(true);
      }
    }
  });

  it('a record carries media, text or a link, never a note on its own', () => {
    for (const state of states) {
      for (const r of state.records) {
        expect(r.media.length > 0 || Boolean(r.text?.trim()) || r.link !== undefined, `${r.id} has none`).toBe(true);
      }
    }
  });

  it('standing is counts only, never a score', () => {
    // Guards the rule rather than the numbers: if somebody adds a field to
    // standing that is a rating rather than a tally, this fails.
    const allowed = new Set([
      'contributorId', 'firstContributionAt', 'lastContributionAt',
      'recordsSubmitted', 'claimsAuthored', 'claimsCorroborated',
      'claimsDisputed', 'disputesRaised', 'disputesRaisedWithAlternative',
      'soundsRightGiven', 'translationsContributed', 'transcriptsContributed',
      'flagsRaised',
    ]);
    for (const state of states) {
      for (const st of state.standings) {
        for (const key of Object.keys(st)) {
          expect(allowed.has(key), `unexpected standing field: ${key}`).toBe(true);
        }
      }
    }
  });

  it('every contributor has a standing, including those who authored nothing', () => {
    for (const state of states) {
      expect(state.standings).toHaveLength(state.contributors.length);
    }
  });

});
