/*import type { Scorer, ScoringResult, ScoringGraph} from "./graph";


export const myScorer: Scorer = {
  score(graph): ScoringResult {
    return { claims: [], matches: [] };
  },
  similarity(a: string, b: string): number {
    return 0;
  },
};

*/

/**
 * Starter scorer.
 *
 * Everything here returns valid shapes, so the file type-checks and the rules
 * run. The numbers are placeholders (0.5). Replace them one helper at a time,
 * using the failing rules as your guide.
 */
import type { Excerpt } from "@sagas/contracts";

import type { Scorer, ScoringGraph, ScoringResult } from "./graph";
import { detailsOf, pointsAt, repliesTo } from "./graph";

/* ------------------------------------------------------------------ */
/* similarity                                                           */
/* ------------------------------------------------------------------ */

/** Lowercase words only, so case and punctuation never matter. */
const words = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Length of the longest common subsequence of two word lists. */
function lcsLength(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]! + 1
          : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  return dp[a.length]![b.length]!;
}

/** 0 to 1: shared words in order, divided by the length of the shorter text. */
function similarity(a: string, b: string): number {
  const x = words(a);
  const y = words(b);
  if (x.length === 0 || y.length === 0) return 0;
  return lcsLength(x, y) / Math.min(x.length, y.length);
}

/* ------------------------------------------------------------------ */
/* Questions about the graph, one helper each                           */
/* ------------------------------------------------------------------ */

/** Replies that point at exactly this detail's words. */
const repliesAt = (g: ScoringGraph, claimId: string, excerpt: Excerpt) =>
  repliesTo(g, claimId).filter((r) => pointsAt(r, excerpt));

/**
 * A detail is contested if a dispute points at its words, or if someone
 * disputes the whole claim (a dispute with no details).
 */
function isContested(
  g: ScoringGraph,
  claimId: string,
  excerpt: Excerpt,
): boolean {
  return repliesTo(g, claimId).some(
    (r) =>
      r.relation === "dispute" &&
      (r.target.details.length === 0 || pointsAt(r, excerpt)),
  );
}

/* ------------------------------------------------------------------ */
/* score                                                                */
/* ------------------------------------------------------------------ */

// NOTE: I guessed the fields of a term ({ family, value }). Cmd-click
// `scoreTerm` in graph.ts to see the real ones, and fix this to match.
const placeholderTerms = () => [
  { name: "placeholder", family: "content" as const, value: 0.5 },
];

function score(g: ScoringGraph): ScoringResult {
  return {
    matches: [],
    claims: g.claims.map((c) => ({
      claimId: c.id,
      score: 0.5, // placeholder
      terms: placeholderTerms(),
      // A claim has details only if some reply points at its words.
      details: detailsOf(g, c.id).map((d) => {
        const replies = repliesAt(g, c.id, d.excerpt);
        return {
          detailId: d.id,
          excerpt: d.excerpt,
          score: 0.5, // placeholder
          terms: placeholderTerms(),
          contested: isContested(g, c.id, d.excerpt),
          claimIds: replies.map((r) => r.id),
          evidenceRecordIds: replies.flatMap((r) =>
            r.evidence.map((e) => e.recordId),
          ),
        };
      }),
    })),
  };
}

export const myScorer: Scorer = { score, similarity };


