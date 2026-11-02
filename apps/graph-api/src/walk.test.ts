import { describe, expect, it } from "vitest";

import { graph } from "@sagas/fixtures/scoring";

import { whatReaches } from "./walk";

// A photo with a claim about it, a document backing only the year, a reply about the
// owner that brings a recording, a dispute of the year, and a reply about the whole
// claim. All the replies answer the photo, so their source is the photo too.
const shop = () =>
  graph()
    .record("photo", { by: "ana", kind: "image" })
    .record("directory", { by: "luis", kind: "document" })
    .record("clip", { by: "ines", kind: "audio" })
    .claim("A", {
      by: "ana",
      source: "photo",
      text: "It opened in 1950, and Ferris owned it.",
      evidence: [{ record: "directory", excerpt: "1950" }],
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
    .dispute("D", "A", "1950", "the road came later")
    .build();

describe("whatReaches", () => {
  it("finds the source record and the evidence naming that excerpt", () => {
    expect(whatReaches(shop(), "A", "1950").records).toEqual([
      "photo",
      "directory",
    ]);
  });

  it("leaves out evidence naming a different excerpt", () => {
    expect(whatReaches(shop(), "A", "Ferris").records).toEqual(["photo"]);
  });

  it("follows extension edges to the claims behind them and the evidence they bring", () => {
    expect(whatReaches(shop(), "A", "Ferris").extensions).toEqual([
      { claimId: "B", evidence: ["clip"] },
    ]);
  });

  it("follows dispute edges too", () => {
    expect(whatReaches(shop(), "A", "1950").disputes).toEqual([
      { claimId: "D", evidence: [] },
    ]);
  });

  it("leaves out a reply about the whole claim, which makes no detail", () => {
    const reaches = whatReaches(shop(), "A", "1950");
    expect(reaches.extensions).toEqual([]);
  });
});
