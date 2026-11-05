/**
 * The builder has to produce graphs that match the schema, or every rule built
 * on it is testing nothing. The rules themselves run in `apps/graph-api`
 * against the intelligence layer's scorer.
 */
import { describe, expect, it } from "vitest";

import { graph } from "./build";
import { detailsOf, scoringGraph, toOf } from "./graph";

describe("graph builder", () => {
  it("builds a graph that matches the schema", () => {
    const g = graph()
      .record("r1", { by: "p1", kind: "audio", transcribed: true })
      .record("photo", { by: "p2", kind: "image" })
      .claim("A", {
        by: "p1",
        source: "r1",
        text: "1950, Mill Road",
        evidence: ["photo"],
      })
      .claim("C", { by: "p3", source: "r1", text: "It was 1960." })
      .dispute("C", "A", { at: "1950", to: "1960" }, "the road came later")
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
      .claim("A", { by: "p1", source: "r1", text: "1950" })
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
      graph().claim("A", { by: "p1", source: "missing", text: "1950" }).build(),
    ).toThrow(/no record missing/);
  });

  it("refuses a dispute on a claim that does not exist", () => {
    expect(() =>
      graph()
        .record("r1", { by: "p1" })
        .claim("A", { by: "p1", source: "r1", text: "1950" })
        .dispute("A", "nobody", { at: "1950", to: "1950" }, "why")
        .build(),
    ).toThrow(/unknown claim/);
  });

  it("repoints a claim at what it disputes or extends", () => {
    const g = graph()
      .record("r1", { by: "p1" })
      .claim("A", { by: "p1", source: "r1", text: "1950, Mill Road" })
      .claim("B", { by: "p2", source: "r1", text: "It was gravel." })
      .extend("B", "A", "Mill Road")
      .build();
    expect(g.claims[0]?.target).toEqual({ recordId: "r1", details: [] });
    expect(g.claims[0]?.relation).toBe("extension");
    expect(g.claims[1]?.target).toEqual({
      claimId: "A",
      details: [{ at: { start: 6, end: 15, text: "Mill Road" } }],
    });
    expect(g.claims[1]?.relation).toBe("extension");
  });

  it("works out a claim's details from what points at it", () => {
    const g = graph()
      .record("r1", { by: "p1" })
      .claim("A", { by: "p1", source: "r1", text: "1950, Mill Road" })
      .claim("B", { by: "p2", source: "r1", text: "It was gravel." })
      .extend("B", "A", "Mill Road")
      .claim("C", { by: "p4", source: "r1", text: "Also gravel." })
      .extend("C", "A", "Mill Road")
      .claim("D", { by: "p5", source: "r1", text: "My family ran it." })
      .extend("D", "A")
      .build();
    expect(detailsOf(g, "A").map((d) => d.excerpt.text)).toEqual(["Mill Road"]);
    expect(detailsOf(g, "B")).toEqual([]);
  });

  it("lets one dispute point at several details, or at the whole claim", () => {
    const g = graph()
      .record("r1", { by: "p1" })
      .claim("A", { by: "p1", source: "r1", text: "Sally bought a pink hat" })
      .claim("D", { by: "p2", source: "r1", text: "Brandon bought a blue hat" })
      .dispute(
        "D",
        "A",
        [
          { at: "Sally", to: "Brandon" },
          { at: "pink", to: "blue" },
        ],
        "I have the receipt",
      )
      .claim("W", { by: "p3", source: "r1", text: "It never happened." })
      .dispute("W", "A", undefined, "I was there")
      .build();
    expect(detailsOf(g, "A").map((d) => d.excerpt.text)).toEqual([
      "Sally",
      "pink",
    ]);
    expect(g.claims[1]?.target.details.map((d) => toOf(d)?.text)[1]).toBe("blue");
    expect(g.claims[2]?.target.details).toEqual([]);
    expect(g.claims[2]?.reasoning).toBe("I was there");
  });

  it("lets a transcript be disputed, and refuses a dispute of a record with no parent", () => {
    const disputing = (parent?: { role: "transcript"; recordId: string }) =>
      graph()
        .record("r1", { by: "p1", kind: "audio" })
        .record("t1", {
          by: "p2",
          ...(parent !== undefined && { parent }),
        })
        .claim("D", { by: "p3", source: "r1", text: "It says Hays." })
        .disputeRecord(
          "D",
          "t1",
          { at: "Hayes", to: "Hays" },
          "the name is misheard",
          "Mr. Hayes ran it",
        )
        .build();
    expect(disputing({ role: "transcript", recordId: "r1" }).claims[0]?.relation).toBe("dispute");
    expect(() => disputing()).toThrow(/can only be extended/);
  });

  it("refuses a dispute with no reasoning", () => {
    expect(() =>
      graph()
        .record("r1", { by: "p1" })
        .claim("A", { by: "p1", source: "r1", text: "1950" })
        .claim("B", { by: "p2", source: "r1", text: "1960" })
        .dispute("B", "A", { at: "1950", to: "1960" }, "  ")
        .build(),
    ).toThrow(/without a reason/);
  });

  it("refuses replacement words that aren't in the reply", () => {
    expect(() =>
      graph()
        .record("r1", { by: "p1" })
        .claim("A", { by: "p1", source: "r1", text: "1950" })
        .claim("B", { by: "p2", source: "r1", text: "It was later." })
        .dispute("B", "A", { at: "1950", to: "1960" }, "why")
        .build(),
    ).toThrow(/isn't in the text of B/);
  });

  it("refuses a target whose words aren't in the claim it points at", () => {
    expect(() =>
      graph()
        .record("r1", { by: "p1" })
        .claim("A", { by: "p1", source: "r1", text: "1950, Mill Road" })
        .claim("B", { by: "p2", source: "r1", text: "It was gravel." })
        .extend("B", "A", "Fourth and Main")
        .build(),
    ).toThrow(/isn't in the text of A/);
  });
});
