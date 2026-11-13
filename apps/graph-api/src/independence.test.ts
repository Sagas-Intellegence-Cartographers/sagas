/**
 * These check the records instead of a score. Most match a rule under
 * "independence" or "matching across branches" in `rules.ts`.
 *
 * The similarity below says yes when the excerpt appears word for word in the
 * other text. It stands in for yours so these tests don't depend on it.
 */
import { describe, expect, it } from "vitest";

import type { GraphBuilder } from "@sagas/fixtures/scoring";
import { detailsOf, findExcerpt, graph } from "@sagas/fixtures/scoring";

import { independence, placeIndex } from "./independence";

const appears = (excerpt: string, text: string): number =>
  text.toLowerCase().includes(excerpt.toLowerCase()) ? 1 : 0;

// A detail exists once something points at it, so the reply makes "1950" one.
const asked = (g: GraphBuilder, source = "r1"): GraphBuilder =>
  g
    .claim("ask", { by: "pa", source, text: "Are you sure?" })
    .extend("ask", "A", "1950");

const base = (): GraphBuilder =>
  asked(
    graph()
      .record("r1", { by: "p1", kind: "audio", transcribed: true })
      .claim("A", { by: "p1", source: "r1", text: "1950, Mill Road" }),
  );

/** Independence of the detail with these words, in claim A. */
const of = (g: GraphBuilder, words = "1950") => {
  const built = g.build();
  const detail = detailsOf(built, "A").find((d) => d.excerpt.text === words);
  if (!detail) throw new Error(`nothing points at "${words}"`);
  return independence(built, "A", detail.excerpt, appears);
};

const countedFor = (g: GraphBuilder, words = "1950"): string[] =>
  of(g, words).counted.map((r) => r.recordId);

describe("independence", () => {
  it("counts nothing for a detail with only a plain reply, since the source isn't support", () => {
    expect(countedFor(base())).toEqual([]);
  });

  it("refuses words nothing points at, because they aren't a detail", () => {
    const road = findExcerpt("1950, Mill Road", "Mill Road");
    if (!road) throw new Error("the words should be in the claim");
    expect(() => independence(base().build(), "A", road, appears)).toThrow(
      /nothing points at/,
    );
  });

  it("counts the record behind the same thing said in another thread", () => {
    const g = base().record("r2", { by: "p2", kind: "document" }).claim("F", {
      by: "p2",
      source: "r2",
      text: "a cat ran across Mill Road in 1950",
    });
    expect(countedFor(g)).toEqual(["r2"]);
  });

  it("skips another thread started by the same person", () => {
    const g = base()
      .record("r2", { by: "p1", kind: "document" })
      .claim("F", { by: "p1", source: "r2", text: "It was 1950." });
    const result = of(g);
    expect(result.counted).toEqual([]);
    expect(result.skipped).toEqual([
      { recordId: "r2", claimId: "F", reason: "same person" },
    ]);
  });

  it("treats claims with the same source record as one thread", () => {
    const g = base().claim("F", {
      by: "p2",
      source: "r1",
      text: "It was 1950.",
    });
    expect(countedFor(g)).toEqual([]);
  });

  it("counts the same file handed over twice once", () => {
    const g = asked(
      graph()
        .record("r1", { by: "p1", kind: "image", hash: "abc" })
        .claim("A", { by: "p1", source: "r1", text: "It was 1950." }),
    )
      .record("r2", { by: "p2", kind: "image", hash: "abc" })
      .claim("F", {
        by: "p2",
        source: "r2",
        text: "the same photo from 1950, posted again",
      });
    expect(countedFor(g)).toEqual([]);
  });

  it("counts evidence cited in two threads once", () => {
    const branch = (evidence: string): GraphBuilder =>
      asked(
        graph()
          .record("r1", { by: "p1", kind: "audio", transcribed: true })
          .record("paper", { by: "p3", kind: "document" })
          .record("paper2", { by: "p4", kind: "document" })
          .claim("A", {
            by: "p1",
            source: "r1",
            text: "It opened in 1950.",
            evidence: ["paper"],
          }),
      )
        .record("r2", { by: "p2", kind: "image" })
        .claim("F", {
          by: "p2",
          source: "r2",
          evidence: [evidence],
          text: "my grandmother's photo of the shop, taken in 1950",
        });
    expect(countedFor(branch("paper"))).toEqual(["r2"]);
    expect(countedFor(branch("paper2"))).toEqual(["r2", "paper2"]);
  });

  it("counts nothing behind a word-for-word copy", () => {
    const g = base()
      .record("r2", { by: "p2" })
      .claim("copy", { by: "p2", source: "r2", text: "1950, Mill Road" });
    const result = of(g);
    expect(result.counted).toEqual([]);
    expect(result.skipped).toEqual([
      { recordId: "r2", claimId: "copy", reason: "copy" },
    ]);
  });

  it("doesn't treat two people writing just the same year as a copy", () => {
    const g = asked(
      graph()
        .record("r1", { by: "p1", kind: "image" })
        .claim("A", { by: "p1", source: "r1", text: "1950" }),
    )
      .record("r2", { by: "p2", kind: "image" })
      .claim("F", { by: "p2", source: "r2", text: "1950" });
    expect(countedFor(g)).toEqual(["r2"]);
  });

  it("finds the same thing in a reply deeper in another thread", () => {
    const g = base()
      .record("r2", { by: "p2", kind: "image" })
      .claim("F", { by: "p2", source: "r2", text: "the corner shop" })
      .claim("G", { by: "p3", source: "r2", text: "That was 1950." })
      .extend("G", "F", "the corner shop");
    expect(countedFor(g)).toEqual(["r2"]);
  });

  it("leaves agreement inside one thread to the replies", () => {
    const g = base()
      .record("r2", { by: "p2", kind: "document" })
      .claim("B", {
        by: "p2",
        source: "r1",
        text: "It was 1950.",
        evidence: ["r2"],
      })
      .extend("B", "A", "Mill Road");
    // B extends the road, not the year, and it's in A's thread, so its matching
    // year isn't a second telling.
    expect(countedFor(g)).toEqual([]);
  });

  it("counts what an extension brings, for the excerpt it targets", () => {
    const g = base()
      .record("photo", { by: "p2", kind: "image" })
      .claim("B", {
        by: "p2",
        source: "r1",
        text: "The shop sign says so.",
        evidence: ["photo"],
      })
      .extend("B", "A", "1950")
      .claim("C", { by: "p3", source: "r1", text: "Which end?" })
      .extend("C", "A", "Mill Road");
    expect(countedFor(g, "1950")).toEqual(["photo"]);
    expect(countedFor(g, "Mill Road")).toEqual([]);
  });

  it("leaves out an extension about the whole claim, which makes no detail", () => {
    const g = base()
      .record("photo", { by: "p2", kind: "image" })
      .claim("B", {
        by: "p2",
        source: "r1",
        text: "The shop sign says so.",
        evidence: ["photo"],
      })
      .extend("B", "A")
      .claim("C", { by: "p3", source: "r1", text: "Which end?" })
      .extend("C", "A", "Mill Road");
    expect(countedFor(g, "1950")).toEqual([]);
    expect(countedFor(g, "Mill Road")).toEqual([]);
  });

  it("doesn't count the claim's own evidence as support for a detail", () => {
    const g = asked(
      graph()
        .record("r1", { by: "p1" })
        .record("directory", { by: "p2", kind: "document" })
        .claim("A", {
          by: "p1",
          source: "r1",
          text: "1950, Mill Road",
          evidence: ["directory"],
        }),
    );
    expect(countedFor(g)).toEqual([]);
  });

  it("counts both records when one reply points at two details", () => {
    const g = base()
      .record("photo", { by: "p2", kind: "image" })
      .claim("B", {
        by: "p2",
        source: "r1",
        text: "The photo shows both.",
        evidence: ["photo"],
      })
      .extend("B", "A", ["1950", "Mill Road"]);
    expect(countedFor(g, "1950")).toEqual(["photo"]);
    expect(countedFor(g, "Mill Road")).toEqual(["photo"]);
  });

  it("never asks similarity about a claim that shares no word with the detail", () => {
    const g = base()
      .record("r2", { by: "p2", kind: "document" })
      .claim("F", { by: "p2", source: "r2", text: "a notice dated 1950" })
      .record("r3", { by: "p3", kind: "document" })
      .claim("U", { by: "p3", source: "r3", text: "painted it blue" })
      .build();
    const seen: string[] = [];
    const detail = detailsOf(g, "A")[0];
    if (!detail) throw new Error("A should have a detail");
    independence(g, "A", detail.excerpt, (_excerpt, text) => {
      seen.push(text);
      return 0;
    });
    expect(seen).toContain("a notice dated 1950");
    expect(seen).not.toContain("painted it blue");
  });

  it("gives a word in most of the place's claims no say, when the excerpt has a rarer one", () => {
    const built = graph()
      .record("r1", { by: "p1" })
      .claim("A", { by: "p1", source: "r1", text: "the mill" })
      .record("r2", { by: "p2" })
      .claim("F", { by: "p2", source: "r2", text: "the road" })
      .record("r3", { by: "p3" })
      .claim("H", { by: "p3", source: "r3", text: "the mill" })
      .claim("ask2", { by: "pa", source: "r1", text: "the what?" })
      .extend("ask2", "A", "the mill")
      .build();
    const seen: string[] = [];
    const detail = detailsOf(built, "A")[0];
    if (!detail) throw new Error("A should have a detail");
    independence(built, "A", detail.excerpt, (_excerpt, text) => {
      seen.push(text);
      return 0;
    });
    expect(seen).toContain("the mill");
    expect(seen).not.toContain("the road");
  });

  it("takes an index built once, and gets the same answer as without one", () => {
    const g = base()
      .record("r2", { by: "p2", kind: "document" })
      .claim("F", {
        by: "p2",
        source: "r2",
        text: "a cat ran across Mill Road in 1950",
      })
      .build();
    const index = placeIndex(g);
    const detail = detailsOf(g, "A")[0];
    if (!detail) throw new Error("A should have a detail");
    expect(
      independence(g, "A", detail.excerpt, appears, { index }),
    ).toEqual(independence(g, "A", detail.excerpt, appears));
  });
});
