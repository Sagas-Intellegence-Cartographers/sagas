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
import type {
  ClaimScore,
  DetailScore,
  Scorer,
  ScoringGraph,
  ScoringResult,
} from "./graph";
import { graph } from "./build";
import { detailId, detailsOf, scoringResult } from "./graph";

const claimOf = (r: ScoringResult, id: string): ClaimScore => {
  const c = r.claims.find((x) => x.claimId === id);
  if (!c) throw new Error(`no score came back for claim ${id}`);
  return c;
};
const claimScore = (r: ScoringResult, id: string): number =>
  claimOf(r, id).score;
/** A detail is named by its claim and its excerpt, the same words the reply chose. */
const detailResult = (
  r: ScoringResult,
  claimId: string,
  excerpt: string,
): DetailScore => {
  const d = claimOf(r, claimId).details.find(
    (x) => x.detailId === detailId(claimId, excerpt),
  );
  if (!d)
    throw new Error(
      `no score came back for the detail "${excerpt}" of claim ${claimId}`,
    );
  return d;
};
const detailScore = (
  r: ScoringResult,
  claimId: string,
  excerpt: string,
): number => detailResult(r, claimId, excerpt).score;

/** Floating point arithmetic can wobble in the last digit. Nothing here cares about that. */
const EPSILON = 1e-9;

/**
 * The claim most rules start from: one person, one recording. A detail only exists
 * once something points at it, so two plain replies make "1950" and "Mill Road"
 * details of A.
 */
const base = (): GraphBuilder =>
  graph()
    .record("r1", { by: "p1", kind: "audio", transcribed: true })
    .claim("A", { by: "p1", source: "r1", text: "1950, Mill Road" })
    .claim("askYear", { by: "pa", source: "r1", text: "Are you sure of that?" })
    .extend("askYear", "A", "1950")
    .claim("askRoad", { by: "pb", source: "r1", text: "Which end of it?" })
    .extend("askRoad", "A", "Mill Road");

export function runScoringRules(name: string, scorer: Scorer): void {
  const score = (g: ScoringGraph): ScoringResult => scorer.score(g);

  describe(`scoring rules: ${name}`, () => {
    describe("what comes back", () => {
      // Prompted by: the changelog entry of 15 October, which replaced the
      // count-based rules.
      it("scores every claim and every detail with finite numbers", () => {
        const g = base()
          .claim("B", { by: "p2", source: "r1", text: "a calico" })
          .extend("B", "A", "Mill Road")
          .build();
        const r = score(g);
        for (const c of g.claims) {
          const cs = claimOf(r, c.id);
          expect(
            Number.isFinite(cs.score),
            `claim ${c.id} scored ${cs.score}`,
          ).toBe(true);
          for (const d of detailsOf(g, c.id)) {
            const s = detailScore(r, c.id, d.excerpt);
            expect(
              Number.isFinite(s),
              `detail "${d.excerpt}" of ${c.id} scored ${s}`,
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

      // Prompted by: the sponsor, 1 November. A detail exists because something
      // points at it, so a claim nothing points at has no details yet.
      it("gives no details to a claim nothing points at", () => {
        const r = score(
          graph()
            .record("r1", { by: "p1" })
            .claim("A", { by: "p1", source: "r1", text: "1950, Mill Road" })
            .build(),
        );
        expect(claimOf(r, "A").details).toEqual([]);
      });

      // Prompted by: the sponsor, 1 November. A result has to be able to say
      // what's behind a detail, so a page can show it.
      it("lists the claims and evidence behind each detail", () => {
        const r = score(
          base()
            .record("photo", { by: "p5", kind: "image" })
            .claim("E", {
              by: "p5",
              source: "r1",
              text: "Here it is in a photo.",
              evidence: ["photo"],
            })
            .extend("E", "A", "Mill Road")
            .build(),
        );
        const road = detailResult(r, "A", "Mill Road");
        expect(road.claimIds).toEqual(expect.arrayContaining(["askRoad", "E"]));
        expect(road.evidenceRecordIds).toEqual(["photo"]);
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
      // This compares a detail's excerpt with what a claim in another thread
      // says, to find the same thing said independently. Prompted by: the
      // sponsor's email of 8 October. Longest common subsequence over words,
      // divided by the length of the shorter one. Synonyms are missed on purpose
      // for now ("crossed" and "ran across").
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

    describe("words never carry weight", () => {
      // Weight comes mostly from evidence and independent support (the list of
      // what's fixed for every scorer, in docs/PHASE-2-INTELLIGENCE-LAYER.md), and
      // how often a word appears in the text adds nothing. Prompted by: the
      // sponsor, 28 October.
      const withText = (text: string): ScoringGraph =>
        graph()
          .record("r1", { by: "p1", kind: "audio", transcribed: true })
          .claim("A", { by: "p1", source: "r1", text })
          .build();

      it("never raises a claim for repeating its own words", () => {
        const once = claimScore(score(withText("Mill Road, 1950")), "A");
        const repeated = claimScore(
          score(withText(`${"Mill Road ".repeat(15)}1950`)),
          "A",
        );
        expect(
          repeated,
          "repeating words in the text raised the claim. Weight comes from the graph, not from how often a word appears",
        ).toBeLessThanOrEqual(once + EPSILON);
      });

      it("adds nothing for extra words in the claim text", () => {
        const plain = claimScore(score(withText("Mill Road, 1950")), "A");
        const wordy = claimScore(
          score(
            withText(
              "Mill Road, 1950. I remember it so well, and we all loved going there.",
            ),
          ),
          "A",
        );
        expect(
          wordy,
          "extra words in the text changed the score. The score comes from the graph",
        ).toBeCloseTo(plain);
      });
    });

    describe("targets", () => {
      // Every claim points at something, and the person writing it chose
      // what. A dispute lands on one detail, never the whole claim. Prompted
      // by: the sponsor's emails of 7 and 12 October.
      const disputed = (): GraphBuilder =>
        base()
          .claim("C", { by: "p3", source: "r1", text: "It was 1960." })
          .dispute("C", "A", "1950", "Mill Road wasn't built until 1958");

      it("leaves the other details alone when one detail is disputed", () => {
        const before = detailScore(score(base().build()), "A", "Mill Road");
        const after = detailScore(score(disputed().build()), "A", "Mill Road");
        expect(after).toBeCloseTo(before);
      });

      it("never raises the detail that was disputed", () => {
        const before = detailScore(score(base().build()), "A", "1950");
        const after = detailScore(score(disputed().build()), "A", "1950");
        expect(after).toBeLessThanOrEqual(before + EPSILON);
      });

      // Prompted by: the sponsor's email of 7 October. A disputed detail is never
      // reported as settled, whatever its score.
      it("reports a disputed detail as contested, and leaves the others alone", () => {
        const r = score(disputed().build());
        expect(detailResult(r, "A", "1950").contested).toBe(true);
        expect(detailResult(r, "A", "Mill Road").contested).toBe(false);
      });

      it("never lowers a detail because someone extended it", () => {
        const before = detailScore(score(base().build()), "A", "Mill Road");
        const after = detailScore(
          score(
            base()
              .claim("B", {
                by: "p2",
                source: "r1",
                text: "It was gravel then.",
              })
              .extend("B", "A", "Mill Road")
              .build(),
          ),
          "A",
          "Mill Road",
        );
        expect(after).toBeGreaterThanOrEqual(before - EPSILON);
      });

      // Prompted by: the sponsor, 1 November. A claim can point at part of a
      // record or part of a claim, and with no excerpt it points at all of it.
      it("treats an extension about the whole claim as making no new detail", () => {
        const g = base()
          .claim("B", {
            by: "p2",
            source: "r1",
            text: "My family ran it until the war.",
          })
          .extend("B", "A")
          .build();
        expect(claimOf(score(g), "A").details).toHaveLength(2);
      });
    });

    describe("evidence and volume", () => {
      // A record is a dense packet of score: a lot can be drawn from it. It
      // tends to outweigh a crowd of voices, and it is not absolute. Evidence
      // can mislead, and the popular reading is sometimes right. Prompted by:
      // the changelog entry that added these rules.
      it("one attached record counts for more than one agreement", () => {
        const evidenced = score(
          base()
            .record("r2", { by: "p2", kind: "image" })
            .claim("X", {
              by: "p1",
              source: "r1",
              text: "It was definitely then.",
              evidence: ["r2"],
            })
            .build(),
        );
        const agreed = score(
          base()
            .record("r2", { by: "p2", kind: "image" })
            .claim("X", {
              by: "p1",
              source: "r1",
              text: "It was definitely then.",
            })
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
            text: `something ${i}`,
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
            text: "It opened in 1950.",
            evidence: ["photoA"],
          })
          .claim("A3", {
            by: "pA3",
            source: "rA",
            text: "My aunt worked there.",
          })
          .extend("A3", "A", "1950")
          .record("rB", { by: "pB" })
          .record("photoB", { by: "pB2", kind: "image" })
          .claim("B", {
            by: "pB",
            source: "rB",
            text: "It opened in 1951.",
            evidence: ["photoB"],
          });
        for (let i = 0; i < 3; i++) {
          b = b
            .record(`rb${i}`, { by: `pb${i}` })
            .claim(`blank${i}`, {
              by: `pb${i}`,
              source: `rb${i}`,
              text: `something ${i}`,
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

      // Prompted by: the sponsor, 1 November. Evidence supports what the claim
      // targets. It can also name particular words of the claim's own text, and
      // then those words are a detail and it backs only them.
      it("lets evidence naming an excerpt raise that detail and leave the others alone", () => {
        const withEvidence = score(
          graph()
            .record("r1", { by: "p1", kind: "audio", transcribed: true })
            .record("photo", { by: "p2", kind: "image" })
            .claim("A", {
              by: "p1",
              source: "r1",
              text: "1950, Mill Road",
              evidence: [{ record: "photo", excerpt: "1950" }],
            })
            .claim("askYear", { by: "pa", source: "r1", text: "Are you sure?" })
            .extend("askYear", "A", "1950")
            .claim("askRoad", { by: "pb", source: "r1", text: "Which end?" })
            .extend("askRoad", "A", "Mill Road")
            .build(),
        );
        const without = score(base().build());
        expect(detailScore(withEvidence, "A", "1950")).toBeGreaterThan(
          detailScore(without, "A", "1950"),
        );
        expect(detailScore(withEvidence, "A", "Mill Road")).toBeCloseTo(
          detailScore(without, "A", "Mill Road"),
        );
      });

      // Prompted by: how hard a record is to fake, one of the ways this project
      // judges independence. A
      // dated photo near the site is harder to fake than a typed paragraph.
      it.todo(
        "a photo or document as evidence counts for more than a typed paragraph",
      );

      // Prompted by: "Recordings are cited and rendered by time window"
      // (decided 25 October). Until the window a claim targets has a transcript,
      // the part of its score that comes from the claim itself (its details and
      // its relations to other claims) isn't counted. Evidence and behaviour
      // still are.
      it("counts a claim's relations only once the window it targets is transcribed", () => {
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
              text: "It opened in 1931.",
            })
            .claim("B", { by: "pB", source: "rec", text: "The first clerk." })
            .extend("B", "A", "1931")
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
            .claim("B", {
              by: "p2",
              source: "r1",
              text: "That was the year.",
              translated,
            })
            .extend("B", "A", "1950")
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
      // Agreement from the same origin isn't support. Claims with the same source
      // record are one thread. S5 in apps/graph-api/BACKLOG.md covers the counting
      // part of this. Prompted by: the sponsor's email of 7 October (claim F).
      const independentBranch = (): GraphBuilder =>
        base().record("r2", { by: "p2", kind: "document" }).claim("F", {
          by: "p2",
          source: "r2",
          text: "a cat ran across Mill Road in 1950",
        });

      it("counts the same thing said in another thread by another person as support", () => {
        const alone = detailScore(score(base().build()), "A", "1950");
        const supported = detailScore(
          score(independentBranch().build()),
          "A",
          "1950",
        );
        expect(supported).toBeGreaterThan(alone);
      });

      it("values that independent thread above ten agreements inside one thread", () => {
        const branch = detailScore(
          score(independentBranch().build()),
          "A",
          "1950",
        );
        const agreed = detailScore(
          score(base().passovers("A", 10).build()),
          "A",
          "1950",
        );
        expect(branch).toBeGreaterThan(agreed);
      });

      it("never lets one person corroborate themselves", () => {
        const alone = detailScore(score(base().build()), "A", "1950");
        const self = detailScore(
          score(
            base()
              .record("r2", { by: "p1", kind: "document" })
              .claim("F", { by: "p1", source: "r2", text: "It was 1950." })
              .build(),
          ),
          "A",
          "1950",
        );
        expect(self).toBeLessThanOrEqual(alone + EPSILON);
      });

      it("counts two claims read from the same record as one source", () => {
        const alone = detailScore(score(base().build()), "A", "1950");
        const sameSource = detailScore(
          score(
            base()
              .claim("F", { by: "p2", source: "r1", text: "It was 1950." })
              .build(),
          ),
          "A",
          "1950",
        );
        expect(sameSource).toBeLessThanOrEqual(alone + EPSILON);
      });

      // Prompted by: the sponsor, 29 October. Once the scorer finds the same thing
      // said in another thread, it checks the records behind both. Two threads
      // leaning on one record look independent, with different people and
      // different source records, but the support behind them is that one record.
      const otherBranch = (evidence: string): number =>
        detailScore(
          score(
            graph()
              .record("r1", { by: "p1", kind: "audio", transcribed: true })
              .record("paper", { by: "p3", kind: "document" })
              .record("paper2", { by: "p4", kind: "document" })
              .claim("A", {
                by: "p1",
                source: "r1",
                text: "It opened in 1950.",
                evidence: ["paper"],
              })
              .claim("ask", { by: "pa", source: "r1", text: "Are you sure?" })
              .extend("ask", "A", "1950")
              .record("r2", { by: "p2", kind: "image" })
              .claim("F", {
                by: "p2",
                source: "r2",
                evidence: [evidence],
                text: "my grandmother's photo of the shop, taken in 1950",
              })
              .build(),
          ),
          "A",
          "1950",
        );

      it("gives a thread leaning on the same evidence less than one that brings its own", () => {
        expect(
          otherBranch("paper"),
          "one newspaper page cited in two threads counted as two",
        ).toBeLessThan(otherBranch("paper2"));
      });

      it("gives a word-for-word copy far less than an independent thread", () => {
        const alone = detailScore(score(base().build()), "A", "1950");
        const copy = detailScore(
          score(
            base()
              .record("r2", { by: "p2" })
              .claim("copy", {
                by: "p2",
                source: "r2",
                text: "1950, Mill Road",
              })
              .build(),
          ),
          "A",
          "1950",
        );
        const branch = detailScore(
          score(independentBranch().build()),
          "A",
          "1950",
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
            source: "r1",
            text: "Here's the road in a photo.",
            evidence: ["photo"],
          })
          .extend("E", "A", "Mill Road")
          .record("r2", { by: "p2", kind: "document" })
          .claim("F", { by: "p2", source: "r2", text: "It was in 1950 or so." })
          .record("r6", { by: "p6", kind: "document" })
          .claim("G", { by: "p6", source: "r6", text: "A notice dated 1950." });

      it("keeps a well-supported detail ahead of one dispute without evidence", () => {
        const r = score(
          wellSupported()
            .claim("D", { by: "p9", source: "r1", text: "It was 1960." })
            .dispute("D", "A", "1950", "I lived next door")
            .claim("askD", { by: "pc", source: "r1", text: "Are you sure?" })
            .extend("askD", "D", "1960")
            .build(),
        );
        expect(detailScore(r, "A", "1950")).toBeGreaterThan(
          detailScore(r, "D", "1960"),
        );
      });

      it("never raises a score because more people disputed it", () => {
        let previous = Infinity;
        for (let n = 0; n <= 4; n++) {
          let b = wellSupported();
          for (let i = 0; i < n; i++) {
            b = b
              .claim(`D${i}`, {
                by: `pd${i}`,
                source: "r1",
                text: `It was 196${i}.`,
              })
              .dispute(`D${i}`, "A", "1950", "that is wrong");
          }
          const s = detailScore(score(b.build()), "A", "1950");
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
          .claim("Q", { by: "pq", source: "rq", text: "It opened in 1949." })
          .claim("askQ", { by: "pc", source: "rq", text: "Are you sure?" })
          .extend("askQ", "Q", "1949");
        for (let i = 0; i < 5; i++) {
          b = b
            .claim(`D${i}`, {
              by: `pd${i}`,
              source: "r1",
              text: `It was 196${i}.`,
            })
            .dispute(`D${i}`, "A", "1950", "that is wrong");
        }
        const r = score(b.build());
        expect(detailScore(r, "A", "1950")).toBeGreaterThan(
          detailScore(r, "Q", "1949"),
        );
      });

      // Prompted by: "I lived next door". A reason backed by a record can be
      // checked; a reason about who someone is can't. How the system checks it
      // is open. What holds already: a record carries more than a reason alone.
      it("gives a dispute backed by a record more than one backed only by a reason", () => {
        const reasonOnly = score(
          base()
            .claim("D", { by: "p9", source: "r1", text: "It was a fence." })
            .dispute("D", "A", "Mill Road", "I lived next door")
            .build(),
        );
        const withRecord = score(
          base()
            .record("letter", { by: "p9", kind: "document" })
            .claim("D", {
              by: "p9",
              source: "r1",
              text: "It was a fence.",
              evidence: ["letter"],
            })
            .dispute(
              "D",
              "A",
              "Mill Road",
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
      // Matching finds where the same thing is said in another thread, by
      // comparing a detail's excerpt with what the claims there say. For this
      // semester a match counts straight away, with the weight coming from the
      // records behind it. That's a temporary choice. Prompted by: the sponsor's
      // emails of 8 and 12 October, and 1 November.
      const found = (r: ScoringResult, a: string, b: string): boolean =>
        r.matches.some(
          (m) =>
            (m.claimId === a && m.matchesClaimId === b) ||
            (m.claimId === b && m.matchesClaimId === a),
        );

      it("proposes a match when a claim in another thread says the same thing", () => {
        const r = score(
          base()
            .record("r2", { by: "p2", kind: "document" })
            .claim("F", { by: "p2", source: "r2", text: "1950" })
            .build(),
        );
        expect(found(r, "A", "F")).toBe(true);
      });

      it("does not propose a match with something unrelated", () => {
        const r = score(
          base()
            .record("r2", { by: "p2" })
            .claim("U", { by: "p2", source: "r2", text: "painted it blue" })
            .build(),
        );
        expect(found(r, "A", "U")).toBe(false);
      });

      // Prompted by: the sponsor, 29 October. Independent accounts are worded
      // differently, so a match that only works on identical text misses them.
      it("proposes a match when the same thing is worded differently", () => {
        const r = score(
          base()
            .record("r2", { by: "p2", kind: "document" })
            .claim("F", {
              by: "p2",
              source: "r2",
              text: "just past the Mill Road crossing",
            })
            .build(),
        );
        expect(
          found(r, "A", "F"),
          '"Mill Road" and "just past the Mill Road crossing" name the same place',
        ).toBe(true);
      });

      // Prompted by: the sponsor, 29 October. The same thing can turn up in a
      // reply far down another thread, and it still counts. Whether support
      // weakens with depth is open (under "How do you tell whether a reply is
      // about what it targets?" in docs/DESIGN-QUESTIONS.md), so this only
      // checks that it counts.
      it("finds the same thing in a reply deeper in another thread, and counts it", () => {
        const alone = detailScore(score(base().build()), "A", "1950");
        const r = score(
          base()
            .record("r2", { by: "p2", kind: "image" })
            .claim("F", { by: "p2", source: "r2", text: "the corner shop" })
            .claim("G", { by: "p3", source: "r2", text: "That was 1950." })
            .extend("G", "F", "the corner shop")
            .build(),
        );
        expect(
          found(r, "A", "G"),
          "the match was missed below the top claim",
        ).toBe(true);
        expect(detailScore(r, "A", "1950")).toBeGreaterThan(alone);
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
      // in docs/DESIGN-QUESTIONS.md. Pointing at an excerpt doesn't show a reply is
      // about it. Open: how to tell, and whether support weakens as it passes
      // through more links.
      it.todo(
        "gives little to a reply that isn't about the excerpt it targets",
      );

      // Prompted by: "How do you tell whether a reply is about what it
      // targets?" in docs/DESIGN-QUESTIONS.md. Open: how a reference (a date,
      // a place, a person, a record, typed inside a claim's text) gets added,
      // whether by the contributor, by a prompt, or by a suggestion the
      // contributor confirms.
      it.todo("reads the references in a reply and its target");

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
      const said = "The Hendersons' cat crossed Mill Road in 1950.";
      const one = (): GraphBuilder =>
        graph()
          .record("r1", { by: "p1", kind: "audio", transcribed: true })
          .claim("c1", { by: "p1", source: "r1", text: said });
      const two = (b: GraphBuilder): GraphBuilder =>
        b
          .record("r2", { by: "p2" })
          .claim("c2", { by: "p2", source: "r2", text: said });
      const three = (b: GraphBuilder): GraphBuilder =>
        b
          .claim("c3", {
            by: "p3",
            source: "r1",
            text: "It was 1960. Mill Road wasn't built until 1958.",
          })
          .dispute("c3", "c1", "1950", "Mill Road wasn't built until 1958");
      const four = (b: GraphBuilder): GraphBuilder =>
        b
          .record("photo", { by: "p4", kind: "image" })
          .claim("c4", {
            by: "p4",
            source: "r1",
            text: "Whiskers on Mill Road, in a photo.",
            evidence: ["photo"],
          })
          .extend("c4", "c1", "Mill Road");

      it("claim 4 helps claim 1 more than claim 2 does", () => {
        const alone = claimScore(score(one().build()), "c1");
        const withTwo = claimScore(score(two(one()).build()), "c1");
        const withFour = claimScore(score(four(one()).build()), "c1");
        expect(withFour - alone).toBeGreaterThan(withTwo - alone);
      });

      it("claim 3 leaves the road alone and does not raise the year", () => {
        const asked = (): GraphBuilder =>
          one()
            .claim("askYear", { by: "pa", source: "r1", text: "Are you sure?" })
            .extend("askYear", "c1", "1950")
            .claim("askRoad", { by: "pb", source: "r1", text: "Which end?" })
            .extend("askRoad", "c1", "Mill Road");
        const before = score(asked().build());
        const after = score(three(asked()).build());
        expect(detailScore(after, "c1", "Mill Road")).toBeCloseTo(
          detailScore(before, "c1", "Mill Road"),
        );
        expect(detailScore(after, "c1", "1950")).toBeLessThanOrEqual(
          detailScore(before, "c1", "1950") + EPSILON,
        );
      });
    });

    describe("worked example: the cat", () => {
      // Prompted by: the sponsor's email of 7 October, written out under "Two
      // worked examples" in docs/PHASE-2-INTELLIGENCE-LAYER.md. A to E all live
      // in one thread, built on record R. F comes from a separate record, and
      // nothing links it to A. G, the resolution, waits on "How should a
      // resolution be recorded?".
      const thread = (): GraphBuilder =>
        graph()
          .record("R", { by: "p1", kind: "audio", transcribed: true })
          .claim("A", {
            by: "p1",
            source: "R",
            text: "The cat crossed the road.",
          })
          .claim("B", { by: "p2", source: "R", text: "It was a calico." })
          .extend("B", "A", "The cat")
          .claim("C", { by: "p3", source: "R", text: "To catch a bird." })
          .extend("C", "A", "crossed");
      const withD = (g: GraphBuilder): GraphBuilder =>
        g
          .claim("D", { by: "p4", source: "R", text: "It was a fence." })
          .dispute("D", "A", "the road", "I lived next door");
      const withE = (g: GraphBuilder): GraphBuilder =>
        g
          .record("photo", { by: "p5", kind: "image" })
          .claim("E", {
            by: "p5",
            source: "R",
            text: "A photo of the cat on the road.",
            evidence: ["photo"],
          })
          .extend("E", "A", "the road");
      const withF = (g: GraphBuilder): GraphBuilder =>
        g.record("news", { by: "p6", kind: "document" }).claim("F", {
          by: "p6",
          source: "news",
          text: "a cat ran across the road that morning",
        });
      // Replies that make "a calico", "To catch a bird" and "a fence" details, so
      // they have a score to compare.
      const asked = (g: GraphBuilder): GraphBuilder =>
        g
          .claim("askB", { by: "pa", source: "R", text: "Are you sure?" })
          .extend("askB", "B", "a calico")
          .claim("askC", { by: "pb", source: "R", text: "Are you sure?" })
          .extend("askC", "C", "To catch a bird")
          .claim("askD", { by: "pc", source: "R", text: "Are you sure?" })
          .extend("askD", "D", "a fence");
      const all = (): ScoringGraph =>
        asked(withF(withE(withD(thread())))).build();

      it("values F, from a separate record, above ten agreements inside A's thread", () => {
        const agreed = detailScore(
          score(withD(thread()).passovers("A", 10).build()),
          "A",
          "the road",
        );
        const independent = detailScore(
          score(withF(withD(thread())).build()),
          "A",
          "the road",
        );
        expect(independent).toBeGreaterThan(agreed);
      });

      it("keeps the road stable through one dispute, with E and F behind it", () => {
        const start = detailScore(
          score(withD(thread()).build()),
          "A",
          "the road",
        );
        expect(detailScore(score(all()), "A", "the road")).toBeGreaterThan(
          start,
        );
      });

      it("leaves calico and the bird still forming, below the road", () => {
        const r = score(all());
        const road = detailScore(r, "A", "the road");
        expect(road).toBeGreaterThan(detailScore(r, "B", "a calico"));
        expect(road).toBeGreaterThan(detailScore(r, "C", "To catch a bird"));
      });

      it("gives the fence, with a reason and no record, less than the road", () => {
        const r = score(all());
        expect(detailScore(r, "D", "a fence")).toBeLessThan(
          detailScore(r, "A", "the road"),
        );
      });

      it("keeps the dispute in the graph, scored like any other claim", () => {
        expect(claimOf(score(all()), "D").score).toBeGreaterThan(0);
      });
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
      it.todo(
        "scores each assertion in a claim on its own, or treats the claim as one",
      );

      // Prompted by: "How should a resolution be recorded?"
      // in docs/DESIGN-QUESTIONS.md.
      // Decided: a resolution is its own edge. Open: what it points at.
      it.todo(
        "lets a resolution raise both branches it reconciles without settling either",
      );

      // Prompted by: "How do you tell a good source from a bad one?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: no tier list of source types; how a source earns weight is the design.
      it.todo(
        "judges a source by what it carries and who independently relies on it",
      );

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
      it.todo(
        "keeps a disagreement about meaning apart from a dispute about a fact",
      );

      // Prompted by: "How to tell a productive argument from a stuck one"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: how long disagreement goes on is not evidence either way.
      it.todo(
        "tells a disagreement that is still gaining evidence from one going in circles",
      );

      // Prompted by: "Moderation without majority capture"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: moderation must never become a vote.
      it.todo("never lets a majority bury a minority claim through reports");

      // Prompted by: "What groups claims together at a site?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: sections are the intelligence layer's to produce; grouping is open.
      it.todo(
        "groups claims into sections from the graph, not from words alone",
      );

      // Prompted by: "Can standing be inherited through vouching?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: vouching collides with \"the scorer reads what a profile has done\".
      it.todo(
        "never lets one profile's standing pass to another by vouching alone",
      );

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
      it.todo(
        "splits a detail that turned out to be two things and keeps its history",
      );

      // Prompted by: "Can a claim be edited?"
      // in docs/DESIGN-QUESTIONS.md.
      // Open: whether text can change, and what happens to edges aimed at the old version.
      it.todo(
        "keeps disputes and extensions attached to the version they answered",
      );

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
      it.todo(
        "weighs the same record differently as evidence for different claims",
      );

      // Prompted by: "Can someone dispute that two records are independent?"
      // in docs/DESIGN-QUESTIONS.md.
      // Decided: anyone can, with reasoning and evidence. Open: its shape.
      it.todo(
        "stops counting two records as independent once that is upheld as wrong",
      );
    });
  });
}
