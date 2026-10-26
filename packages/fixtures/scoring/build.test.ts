/**
 * The builder has to produce graphs that match the schema, or every rule built
 * on it is testing nothing. The rules themselves run in `apps/graph-api`
 * against the intelligence layer's scorer.
 */
import { describe, expect, it } from "vitest";

import { graph } from "./build";
import { scoringGraph } from "./graph";

describe("graph builder", () => {
  it("builds a graph that matches the schema", () => {
    const g = graph()
      .record("r1", { by: "p1", kind: "audio", transcribed: true })
      .record("photo", { by: "p2", kind: "image" })
      .claim("A", {
        by: "p1",
        source: "r1",
        details: { year: "1950", place: "Mill Road" },
        evidence: ["photo"],
      })
      .record("r2", { by: "p3" })
      .claim("C", { by: "p3", source: "r2", details: { year: "1960" } })
      .dispute("C", "A", "year", "the road came later")
      .passovers("A", 2)
      .build();
    expect(() => scoringGraph.parse(g)).not.toThrow();
    expect(g.profiles.map((p) => p.id)).toEqual(
      expect.arrayContaining(["p1", "p2", "p3"]),
    );
  });

  it("gives each event a later time than the one before", () => {
    const g = graph()
      .record("r1", { by: "p1" })
      .claim("A", { by: "p1", source: "r1", details: { year: "1950" } })
      .passover("A", "p2")
      .build();
    const times = [
      g.records[0]!.createdAt,
      g.claims[0]!.createdAt,
      g.passovers[0]!.createdAt,
    ].map(Date.parse);
    expect(times[0]).toBeLessThan(times[1]!);
    expect(times[1]).toBeLessThan(times[2]!);
  });

  it("refuses a claim whose source record was never added", () => {
    expect(() =>
      graph().claim("A", { by: "p1", source: "missing", details: {} }).build(),
    ).toThrow(/no record missing/);
  });

  it("refuses a dispute on a claim that does not exist", () => {
    expect(() =>
      graph()
        .record("r1", { by: "p1" })
        .claim("A", { by: "p1", source: "r1", details: {} })
        .dispute("A", "nobody", "year", "why")
        .build(),
    ).toThrow(/unknown claim/);
  });
});
