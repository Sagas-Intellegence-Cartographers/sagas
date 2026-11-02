/**
 * A worked example of reading the graph by its edges. It isn't a scorer and
 * it doesn't weigh anything. It shows one way to read the graph that the rest
 * of a scorer can build on: start at a detail, follow what points at it, and look
 * everything up by id.
 *
 * A detail is an excerpt of a claim that something points at, and `detailsOf` in
 * `@sagas/fixtures/scoring` works out a claim's details for you.
 *
 * Copy the pattern, change it, or replace it. How support is weighed is your
 * design.
 */
import type { ScoringGraph } from "@sagas/fixtures/scoring";

/** What reaches one detail of a claim. */
export interface WhatReaches {
  /** The claim's own source record, plus evidence on the claim naming this excerpt. */
  records: string[];
  /** Claims that extend this excerpt, with the evidence each one brings. */
  extensions: { claimId: string; evidence: string[] }[];
  /** Claims that dispute this excerpt, with the evidence each one brings. */
  disputes: { claimId: string; evidence: string[] }[];
}

export function whatReaches(
  graph: ScoringGraph,
  claimId: string,
  excerpt: string,
): WhatReaches {
  // Index once, so every lookup below is by id and nothing is searched by text.
  const claims = new Map(graph.claims.map((c) => [c.id, c]));

  const claim = claims.get(claimId);
  if (!claim) throw new Error(`no claim ${claimId} in the graph`);

  // The source record is what the claim stands on, so it isn't independent support
  // for the claim (that's S5). Evidence that names this excerpt backs these words.
  const records = [claim.sourceRecordId];
  for (const e of claim.evidence) {
    if (e.excerpt === excerpt) records.push(e.recordId);
  }

  // The person writing a reply chose its target, so the edge says what it's about,
  // and nothing here reads the reply's text. A reply's source record is the thread's
  // source, which is already in `records`, so only its evidence is listed.
  const extensions: WhatReaches["extensions"] = [];
  const disputes: WhatReaches["disputes"] = [];
  for (const edge of graph.edges) {
    if (edge.toClaimId !== claimId || edge.excerpt !== excerpt) continue;
    const from = claims.get(edge.fromClaimId);
    if (!from) throw new Error(`no claim ${edge.fromClaimId} in the graph`);
    const reply = {
      claimId: from.id,
      evidence: from.evidence.map((e) => e.recordId),
    };
    (edge.type === "extension" ? extensions : disputes).push(reply);
  }

  return { records, extensions, disputes };
}
