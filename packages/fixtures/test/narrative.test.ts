import { describe, expect, it } from 'vitest';
import { composition as compositionSchema } from '@sagas/contracts';
import { siteFixtures } from '../fixtures';
import { reduceToStates } from '../src/reduce';

// The sections and passages are written by hand, so nothing stops a span from
// pointing at a claim that does not exist yet in that state. These checks do.
describe.each(siteFixtures.map((f) => [f.key, f] as const))('narrative stand-ins: %s', (_key, fixture) => {
  const states = reduceToStates(fixture.events, fixture.cuts, fixture.narrative);

  it.each(states.map((s) => [s.stateId, s] as const))('%s: every span leads to something that exists', (_id, state) => {
    const claims = new Map(state.claims.map((c) => [c.claim.id, c]));
    const sectionIds = new Set(state.sections.map((s) => s.id));

    for (const section of state.sections) {
      expect(section.siteId).toBe(state.site.id);
    }

    for (const comp of state.compositions) {
      expect(compositionSchema.safeParse(comp).success).toBe(true);
      expect(sectionIds.has(comp.sectionId)).toBe(true);

      for (const sp of comp.spans) {
        const detailIdsOnClaims = new Set<string>();
        for (const id of sp.claimIds) {
          const claim = claims.get(id);
          expect(claim, `span "${comp.text.slice(sp.start, sp.end)}" points at missing claim ${id}`).toBeDefined();
          claim?.detailStatuses.forEach((d) => detailIdsOnClaims.add(d.detail.id));
        }
        for (const id of sp.detailIds ?? []) {
          expect(detailIdsOnClaims.has(id), `detail ${id} is not on the span's claims`).toBe(true);
        }
      }
    }
  });

  it('every section has exactly one composition', () => {
    for (const state of states) {
      for (const section of state.sections) {
        expect(state.compositions.filter((c) => c.sectionId === section.id)).toHaveLength(1);
      }
    }
  });
});
