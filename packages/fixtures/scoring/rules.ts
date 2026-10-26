/**
 * The rules a scorer has to obey, written against the graph.
 *
 *   import { runScoringRules } from '@sagas/fixtures/scoring/rules';
 *   runScoringRules('graph-api', myScorer);
 *
 * Almost every rule compares one graph with another: this claim scores above
 * that one, adding this never lowers that. No rule pins a score; only the
 * similarity rules check the two ends of their 0 to 1 scale. The arithmetic is
 * yours, and no score is absolute: any input can be outweighed by enough of
 * the others.
 *
 * Each top-level block is an area of the model. At the end of a run the focus
 * summary counts, for each area, how many rules run, how many are still
 * placeholders (`it.todo`), and how many failed. A placeholder carries its context in the
 * comment above it. Some are questions nobody has answered, and answering them
 * is part of your work.
 *
 * Each block says what prompted its rules: the sponsor's email that set them
 * out to the intelligence layer, a section of `docs/CLOSED-QUESTIONS.md` or
 * `docs/DESIGN-QUESTIONS.md`, or the changelog entry that added them. If you think a rule is wrong, open a pull request
 * against this file with your reasoning. Every team is held to the same list.
 */
import { describe, expect, it } from "vitest";

import type { GraphBuilder } from "./build";
import type { ClaimScore, Scorer, ScoringGraph, ScoringResult } from "./graph";
import { graph } from "./build";
import { scoringResult } from "./graph";

const claimOf = (r: ScoringResult, id: string): ClaimScore => {
  const c = r.claims.find((x) => x.claimId === id);
  if (!c) throw new Error(`no score came back for claim ${id}`);
  return c;
};
const claimScore = (r: ScoringResult, id: string): number =>
  claimOf(r, id).score;
const detailScore = (
  r: ScoringResult,
  claimId: string,
  detailId: string,
): number => {
  const d = claimOf(r, claimId).details.find((x) => x.detailId === detailId);
  if (!d)
    throw new Error(
      `no score came back for detail ${detailId} of claim ${claimId}`,
    );
  return d.score;
};

/** Floating point arithmetic can wobble in the last digit. Nothing here cares about that. */
const EPSILON = 1e-9;

/** The claim most rules start from: one person, one recording, two details. */
const base = (): GraphBuilder =>
  graph()
    .record("r1", { by: "p1", kind: "audio", transcribed: true })
    .claim("A", {
      by: "p1",
      source: "r1",
      details: { year: "1950", place: "Mill Road" },
    });

export function runScoringRules(name: string, scorer: Scorer): void {
  const score = (g: ScoringGraph): ScoringResult => scorer.score(g);

  describe(`scoring rules: ${name}`, () => {
    describe("what comes back", () => {
      // Prompted by: the changelog entry of 15 October, which replaced the
      // count-based rules.
      it("scores every claim and every detail with finite numbers", () => {
        const g = base()
          .record("r2", { by: "p2" })
          .claim("B", { by: "p2", source: "r2", details: { who: "a calico" } })
          .extend("B", "A", "place")
          .build();
        const r = score(g);
        for (const c of g.claims) {
          const cs = claimOf(r, c.id);
          expect(
            Number.isFinite(cs.score),
            `claim ${c.id} scored ${cs.score}`,
          ).toBe(true);
          for (const d of c.details) {
            const s = detailScore(r, c.id, d.id);
            expect(
              Number.isFinite(s),
              `detail ${c.id}.${d.id} scored ${s}`,
            ).toBe(true);
          }
        }
      });

      // Terms are how anyone, you included, can see what a score is made of,
      // and later how the system's health is tracked. Prompted by: the same
      // changelog entry.
      it("returns each score with the terms it is made of", () => {
        const r = score(base().build());
        expect(() => scoringResult.parse(r)).not.toThrow();
        expect(
          claimOf(r, "A").terms.length,
          "a score with no terms explains nothing",
        ).toBeGreaterThan(0);
      });

      it("gives the same answer twice for the same graph", () => {
        const g = base().passovers("A", 3).build();
        expect(score(g)).toEqual(score(g));
      });

      // Prompted by: "no single term should consistently dominate". A term
      // that is the largest contributor everywhere means something is broken
      // or being gamed. Needs a varied set of cases to check, so it comes with
      // the worked examples.
      it.todo(
        "no single term is the largest contributor in almost every score",
      );
    });

    describe("similarity between details", () => {
      // Prompted by: the sponsor's email of 8 October. Longest common
      // subsequence over words, divided by the length of the shorter one.
      // Synonyms are missed on purpose for now ("crossed" and "ran across").
      it("scores identical details 1", () => {
        expect(
          scorer.similarity("crossed the road", "crossed the road"),
        ).toBeCloseTo(1);
      });

      it("scores a detail with words added in between as 1", () => {
        expect(
          scorer.similarity("crossed the road", "crossed over the road"),
        ).toBeCloseTo(1);
      });

      it("ignores case", () => {
        expect(
          scorer.similarity("Crossed the Road", "crossed the road"),
        ).toBeCloseTo(1);
      });

      it("scores unrelated details 0", () => {
        expect(
          scorer.similarity("crossed the road", "painted it blue"),
        ).toBeCloseTo(0);
      });

      it("gives the same answer in either order", () => {
        const a = "a cat crossed the road that morning";
        const b = "the cat crossed over the road";
        expect(scorer.similarity(a, b)).toBeCloseTo(scorer.similarity(b, a));
      });

      // Prompted by: 8 October, "normalize tenses and plurals".
      it.todo(
        'treats "crosses the roads" and "crossed the road" as the same words',
      );
    });

    describe("targets", () => {
      // Every claim points at something, and the person writing it chose
      // what. A dispute lands on one detail, never the whole claim. Prompted
      // by: the sponsor's emails of 7 and 12 October.
      const disputed = (): GraphBuilder =>
        base()
          .record("r3", { by: "p3" })
          .claim("C", { by: "p3", source: "r3", details: { year: "1960" } })
          .dispute("C", "A", "year", "Mill Road wasn't built until 1958");

      it("leaves the other details alone when one detail is disputed", () => {
        const before = detailScore(
          score(
            base()
              .record("r3", { by: "p3" })
              .claim("C", { by: "p3", source: "r3", details: { year: "1960" } })
              .build(),
          ),
          "A",
          "place",
        );
        const after = detailScore(score(disputed().build()), "A", "place");
        expect(after).toBeCloseTo(before);
      });

      it("never raises the detail that was disputed", () => {
        const before = detailScore(
          score(
            base()
              .record("r3", { by: "p3" })
              .claim("C", { by: "p3", source: "r3", details: { year: "1960" } })
              .build(),
          ),
          "A",
          "year",
        );
        const after = detailScore(score(disputed().build()), "A", "year");
        expect(after).toBeLessThanOrEqual(before + EPSILON);
      });

      it("never lowers a detail because someone extended it", () => {
        const unlinked = base()
          .record("r2", { by: "p2" })
          .claim("B", { by: "p2", source: "r2", details: { who: "a calico" } });
        const before = detailScore(score(unlinked.build()), "A", "place");
        const after = detailScore(
          score(unlinked.extend("B", "A", "place").build()),
          "A",
          "place",
        );
        expect(after).toBeGreaterThanOrEqual(before - EPSILON);
      });

      // Prompted by: the open question of where evidence attaches. Today a
      // record backs the whole claim. If it should back one detail, the way a
      // claim points at a passage in its source record, evidence on the year
      // would leave the place alone. Undecided.
      it.todo(
        "evidence attached to one detail supports that detail and not the others",
      );
    });

    describe("evidence and volume", () => {
      // A record is a dense packet of score: a lot can be drawn from it. It
      // tends to outweigh a crowd of voices, and it is not absolute. Evidence
      // can mislead, and the popular reading is sometimes right. Prompted by:
      // the changelog entry that added these rules.
      it("one attached record counts for more than one agreement", () => {
        const withRecord = base().record("r2", { by: "p2", kind: "image" });
        const evidenced = score(
          withRecord
            .claim("X", {
              by: "p1",
              source: "r1",
              details: { year: "1950" },
              evidence: ["r2"],
            })
            .build(),
        );
        const agreed = score(
          base()
            .record("r2", { by: "p2", kind: "image" })
            .claim("X", { by: "p1", source: "r1", details: { year: "1950" } })
            .passover("X", "p2")
            .build(),
        );
        expect(claimScore(evidenced, "X")).toBeGreaterThan(
          claimScore(agreed, "X"),
        );
      });

      // "Sounds right" adds very little, but not nothing: a tree where nothing
      // else has happened still has to come out in an order. Prompted by:
      // `docs/CLOSED-QUESTIONS.md`, "affirmation duplicates a passover tier".
      it('still orders claims that differ only in how many people said "sounds right"', () => {
        let b = graph();
        for (let i = 0; i < 5; i++) {
          b = b.record(`r${i}`, { by: `p${i}` }).claim(`blank${i}`, {
            by: `p${i}`,
            source: `r${i}`,
            details: { what: `something ${i}` },
          });
        }
        for (let i = 0; i < 5; i++) b = b.passovers(`blank${i}`, i);
        const r = score(b.build());
        for (let i = 1; i < 5; i++) {
          expect(
            claimScore(r, `blank${i}`),
            `blank${i} should be above blank${i - 1}`,
          ).toBeGreaterThan(claimScore(r, `blank${i - 1}`));
        }
      });

      it("keeps a claim with real support far above claims that only have agreement", () => {
        let b = graph()
          .record("rA", { by: "pA" })
          .record("photoA", { by: "pA2", kind: "image" })
          .claim("A", {
            by: "pA",
            source: "rA",
            details: { year: "1950" },
            evidence: ["photoA"],
          })
          .record("rA3", { by: "pA3" })
          .claim("A3", {
            by: "pA3",
            source: "rA3",
            details: { who: "my aunt" },
          })
          .extend("A3", "A", "year")
          .record("rB", { by: "pB" })
          .record("photoB", { by: "pB2", kind: "image" })
          .claim("B", {
            by: "pB",
            source: "rB",
            details: { year: "1951" },
            evidence: ["photoB"],
          });
        for (let i = 0; i < 3; i++) {
          b = b
            .record(`rb${i}`, { by: `pb${i}` })
            .claim(`blank${i}`, {
              by: `pb${i}`,
              source: `rb${i}`,
              details: { what: `something ${i}` },
            })
            .passovers(`blank${i}`, 50);
        }
        const r = score(b.build());
        expect(
          claimScore(r, "A"),
          "two kinds of support should beat one",
        ).toBeGreaterThan(claimScore(r, "B"));
        for (let i = 0; i < 3; i++) {
          expect(
            claimScore(r, "B"),
            `fifty agreements lifted blank${i} past a claim with a record`,
          ).toBeGreaterThan(claimScore(r, `blank${i}`));
        }
      });

      // Prompted by: how hard a record is to fake, one of the ways this project
      // judges independence. A
      // dated photo near the site is harder to fake than a typed paragraph.
      it.todo(
        "a photo or document as evidence counts for more than a typed paragraph",
      );

      // Prompted by: "Recordings are cited and rendered by time window"
      // (decided 25 October). Until the window a claim cites has a transcript,
      // the part of its score that comes from the claim itself (its details and
      // its relations to other claims) isn't counted. Evidence and behaviour
      // still are.
      it("counts a claim's relations only once the window it cites is transcribed", () => {
        const withWindow = (transcribed: boolean) =>
          graph()
            .record("rec", {
              by: "pA",
              kind: "audio",
              transcribedWindows: transcribed ? [{ start: 0, end: 120 }] : [],
            })
            .claim("A", {
              by: "pA",
              source: "rec",
              window: { start: 18, end: 70 },
              details: { year: "1931" },
            })
            .record("rB", { by: "pB" })
            .claim("B", { by: "pB", source: "rB", details: { who: "the first clerk" } })
            .extend("B", "A", "year")
            .build();
        expect(
          claimScore(score(withWindow(false)), "A"),
          "an extension counted before anyone could read what the claim says",
        ).toBeLessThan(claimScore(score(withWindow(true)), "A"));
      });

      // Prompted by: "no lower score for language or distance" (sponsor, 19
      // October). Many of the people this project is for moved away, or have
      // family history in another language. There's no field for where a
      // contributor lives, so distance can't lower a score; this checks
      // translation.
      it("never scores a translated claim lower than the same claim given in English", () => {
        const g = (translated: boolean) =>
          base()
            .record("r2", { by: "p2" })
            .claim("B", { by: "p2", source: "r2", details: { year: "1950" }, translated })
            .extend("B", "A", "year")
            .build();
        expect(claimScore(score(g(true)), "B")).toBeGreaterThanOrEqual(
          claimScore(score(g(false)), "B"),
        );
      });

      // Prompted by: "How does a link become evidence?" in
      // docs/DESIGN-QUESTIONS.md. Decided: a link's weight comes from its
      // metadata and from independent people relying on it, never from its
      // domain. Links are records in contract 2.4.0. Open: whether a
      // page's content is captured, and what an uncaptured link counts for.
      it.todo(
        "weighs a link by its metadata and by independent people relying on it, never by its domain",
      );
    });

    describe("independence", () => {
      // A focus area: start here once similarity passes. Agreement from the
      // same origin isn't support. Prompted by: the sponsor's email of 7
      // October (claim F).
      const independentBranch = (): GraphBuilder =>
        base()
          .record("r2", { by: "p2", kind: "document" })
          .claim("F", {
            by: "p2",
            source: "r2",
            details: { year: "1950" },
            text: "a cat ran across Mill Road in 1950",
          });

      it("counts a matching detail from another branch and another person as support", () => {
        const alone = detailScore(score(base().build()), "A", "year");
        const supported = detailScore(
          score(independentBranch().build()),
          "A",
          "year",
        );
        expect(supported).toBeGreaterThan(alone);
      });

      it("values that independent branch above ten agreements inside one thread", () => {
        const branch = detailScore(
          score(independentBranch().build()),
          "A",
          "year",
        );
        const agreed = detailScore(
          score(base().passovers("A", 10).build()),
          "A",
          "year",
        );
        expect(branch).toBeGreaterThan(agreed);
      });

      it("never lets one person corroborate themselves", () => {
        const alone = detailScore(score(base().build()), "A", "year");
        const self = detailScore(
          score(
            base()
              .record("r2", { by: "p1", kind: "document" })
              .claim("F", { by: "p1", source: "r2", details: { year: "1950" } })
              .build(),
          ),
          "A",
          "year",
        );
        expect(self).toBeLessThanOrEqual(alone + EPSILON);
      });

      it("counts two claims read from the same record as one source", () => {
        const alone = detailScore(score(base().build()), "A", "year");
        const sameSource = detailScore(
          score(
            base()
              .claim("F", { by: "p2", source: "r1", details: { year: "1950" } })
              .build(),
          ),
          "A",
          "year",
        );
        expect(sameSource).toBeLessThanOrEqual(alone + EPSILON);
      });

      it("gives a word-for-word copy far less than an independent branch", () => {
        const alone = detailScore(score(base().build()), "A", "year");
        const copy = detailScore(
          score(
            base()
              .record("r2", { by: "p2" })
              .claim("copy", {
                by: "p2",
                source: "r2",
                details: { year: "1950", place: "Mill Road" },
                text: "1950, Mill Road",
              })
              .build(),
          ),
          "A",
          "year",
        );
        const branch = detailScore(
          score(independentBranch().build()),
          "A",
          "year",
        );
        expect(
          copy - alone,
          "a copy added as much as an independent account",
        ).toBeLessThan(branch - alone);
      });

      // Prompted by: the timing rule for independence. Similar claims landing within a
      // short window are treated as having one origin, which handles a bot
      // flood and a community session alike. The window is yours to design.
      it.todo("many similar claims arriving together count close to once");

      // Prompted by: independence being open to challenge. Different records count as
      // independent unless someone shows otherwise ("the 1962 newspaper
      // quoted the same neighbour"). There is no shape for that challenge yet.
      it.todo(
        "a successful challenge to independence removes the support it was giving",
      );
    });

    describe("disputes", () => {
      // Prompted by: the sponsor's email of 7 October. One new dispute should
      // not knock over a detail that has independent support.
      const wellSupported = (): GraphBuilder =>
        base()
          .record("photo", { by: "p5", kind: "image" })
          .claim("E", {
            by: "p5",
            source: "photo",
            details: { place: "Mill Road" },
            evidence: ["photo"],
          })
          .extend("E", "A", "place")
          .record("r2", { by: "p2", kind: "document" })
          .claim("F", { by: "p2", source: "r2", details: { year: "1950" } })
          .record("r6", { by: "p6", kind: "document" })
          .claim("G", { by: "p6", source: "r6", details: { year: "1950" } });

      it("keeps a well-supported detail ahead of one dispute without evidence", () => {
        const r = score(
          wellSupported()
            .record("r9", { by: "p9" })
            .claim("D", { by: "p9", source: "r9", details: { year: "1960" } })
            .dispute("D", "A", "year", "I lived next door")
            .build(),
        );
        expect(detailScore(r, "A", "year")).toBeGreaterThan(
          detailScore(r, "D", "year"),
        );
      });

      it("never raises a score because more people disputed it", () => {
        let previous = Infinity;
        for (let n = 0; n <= 4; n++) {
          let b = wellSupported();
          for (let i = 0; i < n; i++) {
            b = b
              .record(`rd${i}`, { by: `pd${i}` })
              .claim(`D${i}`, {
                by: `pd${i}`,
                source: `rd${i}`,
                details: { year: "1960" },
              })
              .dispute(`D${i}`, "A", "year", "that is wrong");
          }
          const s = detailScore(score(b.build()), "A", "year");
          expect(
            s,
            `${n} disputes scored higher than ${n - 1}`,
          ).toBeLessThanOrEqual(previous + EPSILON);
          previous = s;
        }
      });

      it("never lets disputes alone sink a supported detail below a detail nobody supports", () => {
        let b = wellSupported()
          .record("rq", { by: "pq" })
          .claim("Q", { by: "pq", source: "rq", details: { year: "1949" } });
        for (let i = 0; i < 5; i++) {
          b = b
            .record(`rd${i}`, { by: `pd${i}` })
            .claim(`D${i}`, {
              by: `pd${i}`,
              source: `rd${i}`,
              details: { year: "1960" },
            })
            .dispute(`D${i}`, "A", "year", "that is wrong");
        }
        const r = score(b.build());
        expect(detailScore(r, "A", "year")).toBeGreaterThan(
          detailScore(r, "Q", "year"),
        );
      });

      // Prompted by: "I lived next door". A reason backed by a record can be
      // checked; a reason about who someone is can't. How the system checks it
      // is open. What holds already: a record carries more than a reason alone.
      it("gives a dispute backed by a record more than one backed only by a reason", () => {
        const reasonOnly = score(
          base()
            .record("r9", { by: "p9" })
            .claim("D", {
              by: "p9",
              source: "r9",
              details: { place: "a fence" },
            })
            .dispute("D", "A", "place", "I lived next door")
            .build(),
        );
        const withRecord = score(
          base()
            .record("r9", { by: "p9" })
            .record("letter", { by: "p9", kind: "document" })
            .claim("D", {
              by: "p9",
              source: "r9",
              details: { place: "a fence" },
              evidence: ["letter"],
            })
            .dispute(
              "D",
              "A",
              "place",
              "a letter addressed there in 1950 mentions the fence",
            )
            .build(),
        );
        expect(claimScore(withRecord, "D")).toBeGreaterThan(
          claimScore(reasonOnly, "D"),
        );
      });
    });

    describe("matching across branches", () => {
      // Matching text finds where a claim might belong. It is a proposal for a
      // person to confirm and never adds weight by itself. Prompted by: the
      // sponsor's emails of 8 and 12 October.
      const found = (r: ScoringResult, a: string, b: string): boolean =>
        r.matches.some(
          (m) =>
            (m.claimId === a && m.matchesClaimId === b) ||
            (m.claimId === b && m.matchesClaimId === a),
        );

      it("proposes a match between the same detail in two branches", () => {
        const r = score(
          base()
            .record("r2", { by: "p2", kind: "document" })
            .claim("F", { by: "p2", source: "r2", details: { year: "1950" } })
            .build(),
        );
        expect(found(r, "A", "F")).toBe(true);
      });

      it("does not propose a match between unrelated details", () => {
        const r = score(
          base()
            .record("r2", { by: "p2" })
            .claim("U", {
              by: "p2",
              source: "r2",
              details: { what: "painted it blue" },
            })
            .build(),
        );
        expect(found(r, "A", "U")).toBe(false);
      });
    });

    describe("graph shape", () => {
      // Prompted by: the sponsor, 15 October. A claim's place in the graph
      // isn't its number of edges. These come with the worked examples.
      it.todo(
        "ranks two claims with the same number of edges by what those edges carry",
      );
      it.todo(
        "lets support travel along extensions, and stops it going round a cycle",
      );

      // Prompted by: "How do you tell whether a reply is about what it targets?"
      // in docs/DESIGN-QUESTIONS.md. Weight flows through details,
      // so a reply that touches none of its target's details earns nothing.
      // Open: how a claim's content is marked up, and whether support weakens
      // as it passes through more links.
      it.todo(
        "gives nothing to a reply that touches none of the details it targets",
      );

      // Prompted by: "Do all disagreements matter equally?" in
      // docs/DESIGN-QUESTIONS.md. Open: what decides how much a dispute
      // matters, and whether that reaches scoring at all.
      it.todo(
        "lets a disagreement that matters more count differently from a minor one",
      );
    });

    describe("worked example: four claims", () => {
      // Prompted by: the sponsor's email of 12 October. Claim 4 should help
      // claim 1 the most and claim 2 the least. Claim 3 leaves the year
      // contested and the rest of claim 1 alone.
      const one = (): GraphBuilder =>
        graph()
          .record("r1", { by: "p1", kind: "audio", transcribed: true })
          .claim("c1", {
            by: "p1",
            source: "r1",
            details: {
              who: "the Hendersons' cat",
              road: "Mill Road",
              year: "1950",
            },
          });
      const two = (b: GraphBuilder): GraphBuilder =>
        b.record("r2", { by: "p2" }).claim("c2", {
          by: "p2",
          source: "r2",
          details: {
            who: "the Hendersons' cat",
            road: "Mill Road",
            year: "1950",
          },
        });
      const three = (b: GraphBuilder): GraphBuilder =>
        b
          .record("r3", { by: "p3" })
          .claim("c3", { by: "p3", source: "r3", details: { year: "1960" } })
          .dispute("c3", "c1", "year", "Mill Road wasn't built until 1958");
      const four = (b: GraphBuilder): GraphBuilder =>
        b
          .record("r4", { by: "p4" })
          .record("photo", { by: "p4", kind: "image" })
          .claim("c4", {
            by: "p4",
            source: "r4",
            details: { name: "Whiskers", road: "Mill Road" },
            evidence: ["photo"],
          })
          .extend("c4", "c1", "road");

      it("claim 4 helps claim 1 more than claim 2 does", () => {
        const alone = claimScore(score(one().build()), "c1");
        const withTwo = claimScore(score(two(one()).build()), "c1");
        const withFour = claimScore(score(four(one()).build()), "c1");
        expect(withFour - alone).toBeGreaterThan(withTwo - alone);
      });

      it("claim 3 leaves the road alone and does not raise the year", () => {
        const before = score(
          one()
            .record("r3", { by: "p3" })
            .claim("c3", { by: "p3", source: "r3", details: { year: "1960" } })
            .build(),
        );
        const after = score(three(one()).build());
        expect(detailScore(after, "c1", "road")).toBeCloseTo(
          detailScore(before, "c1", "road"),
        );
        expect(detailScore(after, "c1", "year")).toBeLessThanOrEqual(
          detailScore(before, "c1", "year") + EPSILON,
        );
      });

      // Prompted by: the sponsor's email of 7 October. Claims A to G, with
      // each claim's place in the order written out. Comes in a later
      // release.
      it.todo("the cat example from 7 October, claim by claim");
    });

    describe("profiles", () => {
      // Prompted by: the changelog entry of 15 October.
      // Behaviour is scored and identity is not. What a profile has done
      // (its track record, the groups it has joined) is a behaviour term.
      // Which behaviour shows competence is yours to design. Ideas to test,
      // nothing more: records contributed that nobody challenged, claims
      // within a theme, how often their work is challenged or resolved, how
      // often their challenges turn up a real discrepancy, how well
      // corroborated and how disputed their claims are on average.
      it.todo(
        "two profiles with the same history can be swapped without changing any score",
      );
      it.todo(
        "a track record of claims that held up counts as a behaviour term",
      );
    });

    describe("time", () => {
      // Prompted by: "Does a late dispute count for less?" in
      // `docs/DESIGN-QUESTIONS.md`. Time may matter through periods, which
      // are open, and through the swarming window. Age by itself adds nothing: an old claim with no
      // records gains no credibility for being old.
      it.todo("an old claim with no records gains nothing for its age");
      it.todo(
        "a dispute arriving after its period has closed counts differently",
      );
    });

    describe("open questions", () => {
      // Each of these is an open design question with no rule yet. The test
      // names what a rule would check, so the question shows up in your
      // focus summary until it's answered.
      // Prompted by: "Should one claim hold more than one assertion?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: whether a claim with several assertions is split, and by whom.
      it.todo("scores each assertion in a claim on its own, or treats the claim as one");

      // Prompted by: "How should a resolution be recorded?"
      // in docs/DESIGN-QUESTIONS.md.
      // Decided: a resolution is its own edge. Open: what it points at.
      it.todo("lets a resolution raise both branches it reconciles without settling either");

      // Prompted by: "How do you tell a good source from a bad one?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: no tier list of source types; how a source earns weight is the design.
      it.todo("judges a source by what it carries and who independently relies on it");

      // Prompted by: "How to tell silence from doubt"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: \"don't know\" and \"don't care\" are routing signals, never doubt.
      it.todo("never treats a claim nobody reacted to as a doubted claim");

      // Prompted by: "How do claims compare across languages?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: matching details across languages without penalising either.
      it.todo("finds the same detail in claims given in different languages");

      // Prompted by: "How to record disagreement about meaning"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: a disagreement about what words mean, not about facts.
      it.todo("keeps a disagreement about meaning apart from a dispute about a fact");

      // Prompted by: "How to tell a productive argument from a stuck one"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: how long disagreement goes on is not evidence either way.
      it.todo("tells a disagreement that is still gaining evidence from one going in circles");

      // Prompted by: "Moderation without majority capture"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: moderation must never become a vote.
      it.todo("never lets a majority bury a minority claim through reports");

      // Prompted by: "What groups claims together at a site?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: sections are the intelligence layer's to produce; grouping is open.
      it.todo("groups claims into sections from the graph, not from words alone");

      // Prompted by: "Can standing be inherited through vouching?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: vouching collides with \"the scorer reads what a profile has done\".
      it.todo("never lets one profile's standing pass to another by vouching alone");

      // Prompted by: "Is the unit of work a task?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: overlaps \"Is every ask in the system one kind of object?\".
      it.todo("routes an open task to someone able to answer it");

      // Prompted by: "A person named in a claim versus a person with a profile"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: a person mentioned in a claim is not a profile.
      it.todo("never links a person named in a claim to a profile by name");

      // Prompted by: "What happens when one detail turns out to be two people?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: splitting a detail without losing what was said about it.
      it.todo("splits a detail that turned out to be two things and keeps its history");

      // Prompted by: "Can a claim be edited?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: whether text can change, and what happens to edges aimed at the old version.
      it.todo("keeps disputes and extensions attached to the version they answered");

      // Prompted by: "Can a passover point at one detail?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: a detail-level \"sounds right\" overriding the whole-claim one.
      it.todo("lets a reader agree with part of a claim and not the rest");

      // Prompted by: "Is there a state between visible and hidden?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: quarantine keeps a thing visible and weightless while it is checked.
      it.todo("gives a quarantined claim no weight while it stays visible");

      // Prompted by: "Where does a record's weight as evidence live?"
      // in docs/DESIGN-QUESTIONS.md.
      // Decided: on the link between a claim and its evidence. Open: stored or worked out.
      it.todo("weighs the same record differently as evidence for different claims");

      // Prompted by: "Can someone dispute that two records are independent?"
      // in docs/DESIGN-QUESTIONS.md.
      // Decided: anyone can, with reasoning and evidence. Open: its shape.
      it.todo("stops counting two records as independent once that is upheld as wrong");
    });
  });
}
