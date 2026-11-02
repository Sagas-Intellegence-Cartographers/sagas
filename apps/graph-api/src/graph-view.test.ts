import { describe, expect, it } from "vitest";

import { graph } from "@sagas/fixtures/scoring";

import { renderGraph } from "./graph-view";

const shop = () =>
  graph("the-shop")
    .record("photo", { by: "ana", kind: "image" })
    .claim("A", { by: "ana", source: "photo", text: "It opened in <1950>." })
    .claim("D", { by: "omar", source: "photo", text: "It was 1956." })
    .dispute("D", "A", "<1950>", "the road came later")
    .build();

describe("renderGraph", () => {
  it("shows a thread, its claims, and what each one points at", () => {
    const page = renderGraph(shop(), null);
    expect(page).toContain("photo");
    expect(page).toContain("disputes");
    expect(page).toContain("the road came later");
  });

  it("highlights the words something points at, and escapes the text", () => {
    expect(renderGraph(shop(), null)).toContain("<mark>&lt;1950&gt;</mark>");
  });

  it("says so when there are no scores yet", () => {
    expect(renderGraph(shop(), null)).toContain("No scores yet");
  });

  it("shows scores and matches once a scorer returns them", () => {
    const page = renderGraph(shop(), {
      claims: [
        {
          claimId: "A",
          score: 2.5,
          terms: [],
          details: [
            {
              detailId: "A#<1950>",
              excerpt: "<1950>",
              score: 1.5,
              terms: [{ family: "content", name: "base", value: 1.5 }],
              contested: true,
              claimIds: ["D"],
              evidenceRecordIds: [],
            },
          ],
        },
      ],
      matches: [
        {
          claimId: "A",
          detailId: "A#1950",
          matchesClaimId: "F",
          similarity: 1,
        },
      ],
    });
    expect(page).toContain("2.50");
    expect(page).toContain("base 1.50");
    expect(page).toContain("matches what F says");
  });
});
