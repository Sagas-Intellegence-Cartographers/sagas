/**
 * Your scorer. This is the file the rules run against.
 *
 * `score` reads the graph for one place and returns a score for every claim
 * and every detail, each with the terms it is made of. `similarity` says how
 * alike two pieces of detail text are, from 0 to 1. The shapes are in
 * `@sagas/fixtures/scoring`, and the rules are in `rules.ts` beside them.
 *
 * Start with `similarity`: it is the smallest piece and five rules check it.
 * Then `score`. The relationships between claims are already in the graph,
 * because the people who wrote them chose their targets. Read the edges
 * before you reach for the text.
 */
import type {
  Scorer,
  ScoringGraph,
  ScoringResult,
} from "@sagas/fixtures/scoring";

export const scorer: Scorer = {
  similarity(_a: string, _b: string): number {
    throw new Error("not implemented");
  },

  score(_graph: ScoringGraph): ScoringResult {
    throw new Error("not implemented");
  },
};
