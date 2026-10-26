/**
 * The intelligence layer's server: one endpoint, end to end.
 *
 *   pnpm --filter @sagas/graph-api dev
 *
 * Then, from another terminal, score the graph in `example-graph.json`:
 *
 *   curl -X POST http://localhost:3002/score \
 *     -H 'content-type: application/json' \
 *     -d @apps/graph-api/example-graph.json
 *
 * Until `src/scorer.ts` is written, this answers 501. That is expected.
 */
import express from "express";

import { scoringGraph } from "@sagas/fixtures/scoring";

import { scorer } from "./scorer";

const app = express();

// Graphs for a busy place get large, so the body limit is raised.
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * Score everything the archive holds about one place.
 *
 * Validate, score, return. Where the graph comes from (the content layer's
 * API, your own database, the fixtures) is yours to decide. For now it
 * arrives in the request, so you can work on scoring without waiting for
 * anyone.
 */
app.post("/score", (req, res) => {
  const parsed = scoringGraph.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    res.json(scorer.score(parsed.data));
  } catch (err) {
    if (err instanceof Error && err.message === "not implemented") {
      res.status(501).json({
        error: "The scorer is not written yet. Start in src/scorer.ts.",
      });
      return;
    }
    throw err;
  }
});

const port = Number(process.env.PORT ?? 3002);
app.listen(port, () => {
  console.log(`graph-api listening on http://localhost:${port}`);
});
