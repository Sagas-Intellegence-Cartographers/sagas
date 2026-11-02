/**
 * A page for seeing a graph, so you can check what you built against what you meant.
 *
 *   pnpm --filter @sagas/graph-api graph:view
 *   pnpm --filter @sagas/graph-api graph:view cat-graph.json
 *
 * It reads a graph file and writes `graph-view.html` beside it, with no dependencies.
 * Each column is a thread, and each claim sits under what it points at. The words
 * something points at are highlighted, because those are the claim's details. Once
 * your `score` returns something, the scores and matches show too.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  ClaimNode,
  ScoringGraph,
  ScoringResult,
} from "@sagas/fixtures/scoring";
import { detailsOf, scoringGraph } from "@sagas/fixtures/scoring";

import { scorer } from "./scorer";

const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const number = (n: number): string =>
  Number.isInteger(n) ? `${n}` : n.toFixed(2);

/** The claim's text, with each excerpt something points at highlighted. */
function highlighted(graph: ScoringGraph, claim: ClaimNode): string {
  const excerpts = detailsOf(graph, claim.id)
    .map((d) => d.excerpt)
    .sort((a, b) => b.length - a.length);
  if (excerpts.length === 0) return esc(claim.text);
  const pattern = new RegExp(
    excerpts.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g",
  );
  let out = "";
  let last = 0;
  for (const m of claim.text.matchAll(pattern)) {
    out += `${esc(claim.text.slice(last, m.index))}<mark>${esc(m[0])}</mark>`;
    last = m.index + m[0].length;
  }
  return out + esc(claim.text.slice(last));
}

function claimCard(
  graph: ScoringGraph,
  claim: ClaimNode,
  result: ScoringResult | null,
): string {
  const edge = graph.edges.find((e) => e.fromClaimId === claim.id);
  const score = result?.claims.find((c) => c.claimId === claim.id);
  const pointsAt = edge
    ? `<p class="edge ${edge.type}">${edge.type === "dispute" ? "disputes" : "extends"} ${
        edge.excerpt ? `&ldquo;${esc(edge.excerpt)}&rdquo;` : "the whole claim"
      }${edge.type === "dispute" ? ` because ${esc(edge.reason)}` : ""}</p>`
    : claim.target.window
      ? `<p class="edge">points at ${claim.target.window.start}s to ${claim.target.window.end}s of its record</p>`
      : "";
  const evidence = claim.evidence
    .map(
      (e) =>
        `<span class="chip">evidence: ${esc(e.recordId)}${e.excerpt ? ` for &ldquo;${esc(e.excerpt)}&rdquo;` : ""}</span>`,
    )
    .join("");
  const passovers = graph.passovers.filter(
    (p) => p.claimId === claim.id,
  ).length;
  const details = (score?.details ?? [])
    .map(
      (d) =>
        `<li>&ldquo;${esc(d.excerpt)}&rdquo; scores ${number(d.score)}${d.contested ? ", contested" : ""}<small>${d.terms
          .map((t) => `${esc(t.name)} ${number(t.value)}`)
          .join(", ")}</small></li>`,
    )
    .join("");
  const replies = graph.claims
    .filter(
      (c) => c.target.sourceType === "claim" && c.target.sourceId === claim.id,
    )
    .map((c) => claimCard(graph, c, result))
    .join("");
  return `<article class="claim">
  <header><strong>${esc(claim.id)}</strong> by ${esc(claim.contributorId)}${
    score ? ` <span class="score">${number(score.score)}</span>` : ""
  }</header>
  ${pointsAt}
  <p>${highlighted(graph, claim)}</p>
  ${evidence}${passovers ? `<span class="chip">${passovers} passover${passovers === 1 ? "" : "s"}</span>` : ""}
  ${details ? `<ul class="details">${details}</ul>` : ""}
  ${replies ? `<div class="replies">${replies}</div>` : ""}
</article>`;
}

/** The whole page, as a string. `result` is null until your scorer returns something. */
export function renderGraph(
  graph: ScoringGraph,
  result: ScoringResult | null,
): string {
  const threads = graph.records
    .filter((r) => graph.claims.some((c) => c.sourceRecordId === r.id))
    .map((r) => {
      const inThread = graph.claims.filter((c) => c.sourceRecordId === r.id);
      const tops = inThread.filter((c) => c.target.sourceType === "record");
      return `<section class="thread">
  <h2>${esc(r.id)}</h2>
  <p class="record">${esc(r.kind)}, handed over by ${esc(r.contributorId)}</p>
  ${tops.map((c) => claimCard(graph, c, result)).join("")}
</section>`;
    })
    .join("");
  const matches = (result?.matches ?? [])
    .map(
      (m) =>
        `<li>${esc(m.detailId)} matches what ${esc(m.matchesClaimId)} says (${number(m.similarity)})</li>`,
    )
    .join("");
  const status = result
    ? ""
    : `<p class="note">No scores yet, because <code>score</code> in <code>src/scorer.ts</code> isn't written. The graph still shows.</p>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(graph.siteId)}</title>
<style>
  :root { color-scheme: light dark; --line: #bbb; --soft: #f4f3ef; --mark: #ffe58a; --ink: #222; --bg: #fff; --dispute: #a4342a; --extend: #27633f; }
  @media (prefers-color-scheme: dark) { :root { --line: #555; --soft: #26262a; --mark: #7a6500; --ink: #eee; --bg: #18181b; --dispute: #f19a90; --extend: #8fd3a8; } }
  body { font: 15px/1.45 system-ui, sans-serif; margin: 16px; color: var(--ink); background: var(--bg); }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 0; }
  .threads { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; margin-top: 16px; }
  .thread { flex: 1 1 340px; min-width: 0; background: var(--soft); border-radius: 8px; padding: 12px; }
  .record { margin: 2px 0 10px; font-size: 13px; }
  .claim { background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; margin-top: 8px; overflow-wrap: anywhere; }
  .claim p { margin: 4px 0; } .replies { border-left: 2px solid var(--line); margin: 8px 0 0 2px; padding-left: 8px; }
  .edge { font-size: 13px; } .dispute { color: var(--dispute); } .extension { color: var(--extend); }
  mark { background: var(--mark); color: inherit; padding: 0 2px; }
  .chip { display: inline-block; font-size: 12px; border: 1px solid var(--line); border-radius: 10px; padding: 0 8px; margin: 2px 4px 2px 0; }
  .score { float: right; font-weight: 600; } .details { margin: 6px 0 0; padding-left: 18px; font-size: 13px; }
  small { display: block; opacity: 0.8; } .note { font-size: 14px; }
</style>
</head>
<body>
<h1>${esc(graph.siteId)}</h1>
<p>${graph.claims.length} claims in ${graph.records.filter((r) => graph.claims.some((c) => c.sourceRecordId === r.id)).length} threads. Each column is a thread. Highlighted words are details.</p>
${status}
<div class="threads">${threads}</div>
${matches ? `<h2>Matches across threads</h2><ul>${matches}</ul>` : ""}
</body>
</html>
`;
}

function scoreIfYouCan(graph: ScoringGraph): ScoringResult | null {
  try {
    return scorer.score(graph);
  } catch {
    return null;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = resolve(process.argv[2] ?? "example-graph.json");
  const graph = scoringGraph.parse(JSON.parse(readFileSync(file, "utf8")));
  const out = resolve("graph-view.html");
  writeFileSync(out, renderGraph(graph, scoreIfYouCan(graph)));
  console.log(`Wrote ${out}. Open it in a browser.`);
}
