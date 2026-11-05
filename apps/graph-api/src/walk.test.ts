import { describe, expect, it } from "vitest";

import { findExcerpt, graph } from "@sagas/fixtures/scoring";

import { whatReaches } from "./walk";

// A photo with a claim about it, a reply about the owner that brings a recording, a
// dispute of the year, and a reply about the whole claim. All the replies answer the
// photo, so their source is the photo too.
const TEXT = "It opened in 1950, and Ferris owned it.";
const at = (words: string) => {
  const excerpt = findExcerpt(TEXT, words);
  if (!excerpt) throw new Error(`"${words}" isn't in the claim`);
  return excerpt;
};

const shop = () =>
  graph()
    .record("photo", { by: "ana", kind: "image" })
    .record("clip", { by: "ines", kind: "audio" })
    .claim("A", {
      by: "ana",
      source: "photo",
      text: TEXT,
    })
    .claim("B", {
      by: "ines",
      source: "photo",
      text: "He was my uncle.",
      evidence: ["clip"],
    })
    .extend("B", "A", "Ferris")
    .claim("C", { by: "luis", source: "photo", text: "That's the shop sign." })
    .extend("C", "A")
    .claim("D", { by: "omar", source: "photo", text: "It was 1956." })
    .dispute("D", "A", { at: "1950", to: "1956" }, "the road came later")
    .build();

describe("whatReaches", () => {
  it("finds the source record", () => {
    expect(whatReaches(shop(), "A", at("1950")).records).toEqual(["photo"]);
  });

  it("follows extensions to the claims behind them and the evidence they bring", () => {
    expect(whatReaches(shop(), "A", at("Ferris")).extensions).toEqual([
      { claimId: "B", evidence: ["clip"] },
    ]);
  });

  it("follows disputes too", () => {
    expect(whatReaches(shop(), "A", at("1950")).disputes).toEqual([
      { claimId: "D", evidence: [] },
    ]);
  });

  it("leaves out a reply about the whole claim, which makes no detail", () => {
    const reaches = whatReaches(shop(), "A", at("1950"));
    expect(reaches.extensions).toEqual([]);
  });
});
