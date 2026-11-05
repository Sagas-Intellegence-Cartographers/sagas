/**
 * A worked example of reading the graph by what points at what. It isn't a scorer and
 * it doesn't weigh anything. It shows one way to read the graph that the rest
 * of a scorer can build on: start at a detail, follow what points at it, and look
 * everything up by id.
 *
 * A detail is an excerpt of a claim that another claim points at, and `detailsOf` in
 * `@sagas/fixtures/scoring` works out a claim's details for you.
 *
 * Copy the pattern, change it, or replace it. How support is weighed is your
 * design.
 */
import type { Excerpt } from "@sagas/contracts";
import type { ScoringGraph } from "@sagas/fixtures/scoring";
import { contests, pointsAt, repliesTo } from "@sagas/fixtures/scoring";

/** What reaches one detail of a claim. */
export interface WhatReaches {
  /** The claim's own source record. */
  records: string[];
  /** Claims that extend this excerpt, with the evidence each one brings. */
  extensions: { claimId: string; evidence: string[] }[];
  /** Claims that contest this excerpt, with the evidence each one brings. */
  disputes: { claimId: string; evidence: string[] }[];
}

export function whatReaches(
  graph: ScoringGraph,
  claimId: string,
  excerpt: Excerpt,
): WhatReaches {
  const claim = graph.claims.find((c) => c.id === claimId);
  if (!claim) throw new Error(`no claim ${claimId} in the graph`);

  // The source record is what the claim stands on, so it isn't independent support
  // for the claim (that's S5).
  const records = [claim.sourceRecordId];

  // The person writing a reply chose its target and details, so those say what it's
  // about, and nothing here reads the reply's text. A reply's source record is the
  // thread's source, which is already in `records`, so only its evidence is listed.
  const extensions: WhatReaches["extensions"] = [];
  const disputes: WhatReaches["disputes"] = [];
  for (const from of repliesTo(graph, claimId)) {
    const reply = {
      claimId: from.id,
      evidence: from.evidence.map((e) => e.recordId),
    };
    if (contests(from, excerpt)) disputes.push(reply);
    else if (from.relation === "extension" && pointsAt(from, excerpt))
      extensions.push(reply);
  }

  return { records, extensions, disputes };
}
