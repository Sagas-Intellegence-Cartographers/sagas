/**
 * A first-attempt Sagas scorer.
 *
 *   import { runScoringRules } from "@sagas/fixtures/scoring/rules";
 *   import { createScorer } from "./scorer";
 *   runScoringRules("graph-api", createScorer({ keywords: claimsSystemKeywords }));
 *
 * Shape of the model
 * ------------------
 * Every score is a sum of named terms, so you can always see what it is made of.
 *
 *   details      what the claim says, once its recording has a transcript
 *   specificity  a tiny credit for how many distinct keywords the claim carries
 *   evidence     records attached to back the claim (dense, so worth the most)
 *   passovers    "sounds right" from other people (light, saturating, never zero-to-one)
 *   corroboration  matching details from other people on other records
 *   relations    extensions other people attached to it
 *   disputes     a bounded discount, never a way to sink a supported detail
 *                below a detail nobody supports
 *
 * Things the rules force, and where they live:
 *   - Similarity is longest-common-subsequence over words / the shorter length.
 *   - Support only counts across different people AND different origins
 *     (record id or content hash). One person, or one record, counts once.
 *   - A near word-for-word copy of the claim it supports counts for a tenth.
 *   - Disputes land on one detail, and saturate, so more of them never raise a score.
 *   - Translation, distance and age are never inputs. (`translated` is read
 *     nowhere on purpose.)
 *   - "Don't know" / "don't care" passovers are silence, not doubt: they add
 *     nothing and subtract nothing.
 *   - A claim that cites a stretch of a recording with no transcript gets
 *     nothing from what the claim itself says until a transcript covers it.
 *
 * Every constant is in `TUNING` so you can move them without touching the logic.
 */
import type {
  ClaimNode,
  ClaimScore,
  Detail,
  DetailScore,
  Match,
  RecordNode,
  Scorer,
  ScoringGraph,
  ScoringResult,
  Term,
} from "./graph";

/* ------------------------------------------------------------------ */
/* Tuning                                                               */
/* ------------------------------------------------------------------ */

const TUNING = {
  /** What a readable claim starts with. */
  base: 0.2,
  /** Per distinct keyword, capped. Deliberately tiny. */
  specificityPerKeyword: 0.005,
  specificityCap: 0.03,

  /** One image/document as evidence is worth this before kind weighting. */
  evidence: 0.3,
  /** Each further piece of evidence counts this much of the one before. */
  evidenceDecay: 0.6,
  /** Evidence the claim's own author supplied counts for this fraction. */
  ownEvidence: 0.5,
  /** How much of the claim's evidence each of its details inherits. */
  evidenceShareToDetail: 0.5,

  /** Ceiling of all "sounds right" credit on one claim, approached never reached. */
  passoverCeiling: 0.15,
  /** Bigger = slower saturation. */
  passoverScale: 8,
  /** How much of the claim's passover credit each of its details inherits. */
  passoverShareToDetail: 0.5,

  /** One independent matching detail. */
  support: 0.12,
  supportDecay: 0.65,
  /** A near word-for-word copy keeps this fraction of its weight. */
  copyFactor: 0.1,
  /** Claim-text overlap at or above this (LCS / longer text) is a copy. */
  copyThreshold: 0.85,
  /** Details at or above this similarity (and of the same kind) are the same detail. */
  matchThreshold: 0.6,
  /** Keyword overlap scales support between these two multipliers. */
  keywordFitFloor: 0.85,

  /** One independent extension. */
  extension: 0.1,
  extensionDecay: 0.6,
  /** An extension of the whole claim, seen from one detail. */
  wholeClaimExtensionToDetail: 0.5,

  /** A dispute with no record behind it, and the extra a backing record adds. */
  disputeBase: 0.5,
  disputeBacked: 0.5,
  /** Evidence total at which a dispute counts as fully backed. */
  disputeBackedAt: 0.3,
  /** The most that disputes can take off, as a fraction. */
  disputeMaxDiscount: 0.4,
  disputeScale: 1.5,
} as const;

const EVIDENCE_KIND_WEIGHT: Record<RecordNode["kind"], number> = {
  image: 1,
  document: 1,
  audio: 0.9,
  video: 0.9,
  link: 0.6,
  text: 0.5,
};

/* ------------------------------------------------------------------ */
/* Text                                                                 */
/* ------------------------------------------------------------------ */

/** Words, any script. Case-folded, punctuation dropped, inner apostrophes kept. */
export function words(text: string): string[] {
  const found = text.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu);
  return (found ?? []).map((w) => w.replace(/['’]+$/u, "")).filter((w) => w.length > 0);
}

/** Longest common subsequence length over two word lists. */
function lcsLength(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]! + 1
          : Math.max(prev[j]!, cur[j - 1]!);
    }
    prev = cur;
  }
  return prev[b.length]!;
}

/** LCS over words divided by the length of the shorter. 0 to 1, symmetric. */
export function similarity(a: string, b: string): number {
  const wa = words(a);
  const wb = words(b);
  const shorter = Math.min(wa.length, wb.length);
  if (shorter === 0) return 0;
  return Math.min(1, lcsLength(wa, wb) / shorter);
}

/** Stricter, for copy detection: divides by the LONGER text, so a short claim
 *  that is merely contained in a long one is not a copy of it. */
function copiness(a: string, b: string): number {
  const wa = words(a);
  const wb = words(b);
  const longer = Math.max(wa.length, wb.length);
  if (longer === 0) return 0;
  return lcsLength(wa, wb) / longer;
}

/**
 * Fallback keywords: the words minus a short English stop list. This is a
 * placeholder for the claims system's real keyword extraction; pass yours in
 * through `createScorer({ keywords })`.
 */
const STOP = new Set(
  "a an the and or but of in on at to for from by with as is are was were be been it its this that these those i me my we our you your he she they them his her their there here so than then not no".split(
    " ",
  ),
);
export function defaultKeywords(text: string): string[] {
  return words(text).filter((w) => !STOP.has(w));
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * ADJUST ME: this must match `scoreTerm` in `@sagas/contracts`. I wrote it
 * without seeing that file, so the field names are a guess. It is the only
 * place a term is built.
 */
function term(name: string, value: number, note?: string): Term {
  return { name, value, ...(note !== undefined && { note }) } as unknown as Term;
}

/** 0 at 0, rising towards 1, strictly increasing. */
const saturate = (x: number, scale: number): number => 1 - Math.exp(-x / scale);

const sum = (xs: number[]): number => xs.reduce((s, x) => s + x, 0);

/** Sorted largest first, each one counting `decay` times the one before. */
function diminishing(weights: number[], decay: number): number {
  return [...weights]
    .sort((a, b) => b - a)
    .reduce((total, w, i) => total + w * decay ** i, 0);
}

function covered(
  windows: { start: number; end: number }[],
  want: { start: number; end: number },
): boolean {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const w of sorted) {
    const last = merged[merged.length - 1];
    if (last && w.start <= last.end) last.end = Math.max(last.end, w.end);
    else merged.push({ ...w });
  }
  return merged.some((m) => m.start <= want.start && m.end >= want.end);
}

/** Can anyone read what this claim says yet? */
function isReadable(rec: RecordNode | undefined, claim: ClaimNode): boolean {
  if (!rec) return false;
  if (rec.kind !== "audio" && rec.kind !== "video") return true;
  const wins = rec.transcribedWindows;
  const hasWindows = wins !== undefined && wins.length > 0;
  if (rec.transcribed === true && !hasWindows) return true;
  if (!hasWindows) return false;
  if (!claim.sourceWindow) return true; // cites the whole thing; some of it is readable
  return covered(wins, claim.sourceWindow);
}

/* ------------------------------------------------------------------ */
/* The scorer                                                           */
/* ------------------------------------------------------------------ */

export interface ScorerOptions {
  /** The claims system's keyword extractor. Used for specificity and for how
   *  well two claims' topics fit. Defaults to words minus English stop words. */
  keywords?: (text: string) => string[];
}

export function createScorer(options: ScorerOptions = {}): Scorer {
  const keywordsOf = options.keywords ?? defaultKeywords;

  function score(g: ScoringGraph): ScoringResult {
    const recordById = new Map(g.records.map((r) => [r.id, r]));
    const claimById = new Map(g.claims.map((c) => [c.id, c]));

    /* ---- per-claim facts, computed once ---- */
    const readable = new Map<string, boolean>();
    const keywordSet = new Map<string, Set<string>>();
    for (const c of g.claims) {
      readable.set(c.id, isReadable(recordById.get(c.sourceRecordId), c));
      keywordSet.set(c.id, new Set(keywordsOf(c.text)));
    }
    const isReadableClaim = (id: string): boolean => readable.get(id) === true;

    /** Two claims come from one origin if they cite the same record or the same file. */
    const originKeys = (c: ClaimNode): string[] => {
      const rec = recordById.get(c.sourceRecordId);
      const keys = [`record:${c.sourceRecordId}`];
      if (rec?.contentHash) keys.push(`hash:${rec.contentHash}`);
      return keys;
    };
    const sameOrigin = (a: ClaimNode, b: ClaimNode): boolean => {
      const ka = new Set(originKeys(a));
      return originKeys(b).some((k) => ka.has(k));
    };

    /** How well two claims' topics fit, from keyword overlap. */
    const keywordFit = (a: ClaimNode, b: ClaimNode): number => {
      const ka = keywordSet.get(a.id)!;
      const kb = keywordSet.get(b.id)!;
      const smaller = Math.min(ka.size, kb.size);
      const floor = TUNING.keywordFitFloor;
      if (smaller === 0) return (1 + floor) / 2;
      let shared = 0;
      for (const k of ka) if (kb.has(k)) shared += 1;
      return floor + (1 - floor) * (shared / smaller);
    };

    /* ---- evidence ---- */
    const evidenceTotal = new Map<string, number>();
    for (const c of g.claims) {
      const source = recordById.get(c.sourceRecordId);
      const seen = new Set<string>();
      const weights: number[] = [];
      for (const e of c.evidence) {
        const rec = recordById.get(e.recordId);
        if (!rec || rec.id === c.sourceRecordId) continue; // a source isn't evidence for itself
        if (source?.contentHash && rec.contentHash === source.contentHash) continue;
        const key = rec.contentHash ? `hash:${rec.contentHash}` : `record:${rec.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const own = rec.contributorId === c.contributorId ? TUNING.ownEvidence : 1;
        weights.push(EVIDENCE_KIND_WEIGHT[rec.kind] * own);
      }
      evidenceTotal.set(
        c.id,
        TUNING.evidence * diminishing(weights, TUNING.evidenceDecay),
      );
    }

    /* ---- passovers: one "sounds right" per other person per claim ---- */
    const passoverValue = new Map<string, number>();
    for (const c of g.claims) {
      const people = new Set(
        g.passovers
          .filter(
            (p) =>
              p.claimId === c.id &&
              p.kind === "sounds_right" &&
              p.contributorId !== c.contributorId,
          )
          .map((p) => p.contributorId),
      );
      passoverValue.set(
        c.id,
        TUNING.passoverCeiling * saturate(people.size, TUNING.passoverScale),
      );
    }

    /* ---- corroboration of one detail by matching details elsewhere ---- */
    const supportFor = (c: ClaimNode, d: Detail): number => {
      if (!isReadableClaim(c.id)) return 0;
      const candidates: { weight: number; contributor: string; origins: string[]; claim: string }[] = [];
      for (const y of g.claims) {
        if (y.id === c.id) continue;
        if (y.contributorId === c.contributorId) continue; // nobody corroborates themselves
        if (sameOrigin(c, y)) continue; // one record is one source
        if (!isReadableClaim(y.id)) continue;
        let best = 0;
        for (const dy of y.details) {
          if (dy.kind !== d.kind) continue;
          const s = similarity(d.value, dy.value);
          if (s >= TUNING.matchThreshold && s > best) best = s;
        }
        if (best === 0) continue;
        const isCopy = copiness(c.text, y.text) >= TUNING.copyThreshold;
        candidates.push({
          weight:
            TUNING.support * best * keywordFit(c, y) * (isCopy ? TUNING.copyFactor : 1),
          contributor: y.contributorId,
          origins: originKeys(y),
          claim: y.id,
        });
      }
      // Strongest first; a person or an origin can only be counted once.
      candidates.sort((a, b) => b.weight - a.weight || a.claim.localeCompare(b.claim));
      const people = new Set<string>();
      const origins = new Set<string>();
      const counted: number[] = [];
      for (const k of candidates) {
        if (people.has(k.contributor) || k.origins.some((o) => origins.has(o))) continue;
        people.add(k.contributor);
        k.origins.forEach((o) => origins.add(o));
        counted.push(k.weight);
      }
      return diminishing(counted, TUNING.supportDecay);
    };

    /* ---- extensions ---- */
    const extensionsOf = (
      c: ClaimNode,
      detailId: string | "any",
    ): number => {
      if (!isReadableClaim(c.id)) return 0;
      const detailIds = new Set(c.details.map((d) => d.id));
      const people = new Set<string>();
      const weights: number[] = [];
      for (const e of g.edges) {
        if (e.type !== "extension" || e.toClaimId !== c.id) continue;
        if (e.toDetailId !== undefined && !detailIds.has(e.toDetailId)) continue;
        const from = claimById.get(e.fromClaimId);
        if (!from || from.contributorId === c.contributorId) continue;
        if (sameOrigin(c, from) || !isReadableClaim(from.id)) continue;
        if (people.has(from.contributorId)) continue;
        let w = TUNING.extension;
        if (detailId !== "any") {
          if (e.toDetailId === undefined) w *= TUNING.wholeClaimExtensionToDetail;
          else if (e.toDetailId !== detailId) continue;
        }
        people.add(from.contributorId);
        weights.push(w);
      }
      return diminishing(weights, TUNING.extensionDecay);
    };

    /* ---- disputes: how much of a discount a detail has earned ---- */
    const disputeSaturation = (c: ClaimNode, detailId: string): number => {
      const byPerson = new Map<string, number>();
      for (const e of g.edges) {
        if (e.type !== "dispute" || e.toClaimId !== c.id || e.toDetailId !== detailId) continue;
        const from = claimById.get(e.fromClaimId);
        if (!from || from.contributorId === c.contributorId) continue;
        if (!isReadableClaim(from.id)) continue;
        // A reason alone can be argued with; a record behind it can be checked.
        const backed = Math.min(
          1,
          (evidenceTotal.get(from.id) ?? 0) / TUNING.disputeBackedAt,
        );
        const w = TUNING.disputeBase + TUNING.disputeBacked * backed;
        byPerson.set(from.contributorId, Math.max(byPerson.get(from.contributorId) ?? 0, w));
      }
      return saturate(sum([...byPerson.values()]), TUNING.disputeScale);
    };
    const discount = (sat: number): number => 1 - TUNING.disputeMaxDiscount * sat;

    /* ---- put it together ---- */
    const claims: ClaimScore[] = g.claims.map((c) => {
      const ok = isReadableClaim(c.id);
      const evidence = evidenceTotal.get(c.id) ?? 0;
      const passovers = passoverValue.get(c.id) ?? 0;

      const detailScores: DetailScore[] = c.details.map((d) => {
        const base = ok ? TUNING.base : 0;
        const support = supportFor(c, d);
        const relations = extensionsOf(c, d.id);
        const terms = [
          term("details", base),
          term("corroboration", support, "matching details from other people on other records"),
          term("relations", relations),
          term("evidence", evidence * TUNING.evidenceShareToDetail),
          term("passovers", passovers * TUNING.passoverShareToDetail),
        ];
        const sat = disputeSaturation(c, d.id);
        const raw = sum(terms.map((t) => (t as unknown as { value: number }).value));
        const final = raw * discount(sat);
        if (sat > 0) terms.push(term("disputes", final - raw));
        return { detailId: d.id, score: Math.max(0, final), terms } as unknown as DetailScore;
      });

      const specificity = ok
        ? Math.min(
            TUNING.specificityCap,
            TUNING.specificityPerKeyword * (keywordSet.get(c.id)?.size ?? 0),
          )
        : 0;
      const corroboration = ok
        ? c.details.length === 0
          ? 0
          : sum(c.details.map((d) => supportFor(c, d))) / c.details.length
        : 0;
      const relations = extensionsOf(c, "any");
      const maxSat = Math.max(0, ...c.details.map((d) => disputeSaturation(c, d.id)));

      const terms = [
        term("details", ok ? TUNING.base : 0),
        term("specificity", specificity),
        term("evidence", evidence),
        term("passovers", passovers),
        term("corroboration", corroboration),
        term("relations", relations),
      ];
      const positive = sum(terms.map((t) => (t as unknown as { value: number }).value));
      terms.push(term("disputes", positive * discount(maxSat) - positive));
      return {
        claimId: c.id,
        score: Math.max(0, positive * discount(maxSat)),
        terms,
        details: detailScores,
      } as unknown as ClaimScore;
    });

    /* ---- proposals: the same-looking detail in two different branches ---- */
    const matches: Match[] = [];
    for (let i = 0; i < g.claims.length; i++) {
      for (let j = i + 1; j < g.claims.length; j++) {
        const a = g.claims[i]!;
        const b = g.claims[j]!;
        if (sameOrigin(a, b)) continue;
        for (const da of a.details) {
          for (const db of b.details) {
            if (da.kind !== db.kind) continue;
            const s = similarity(da.value, db.value);
            if (s < TUNING.matchThreshold) continue;
            matches.push({
              claimId: a.id,
              detailId: da.id,
              matchesClaimId: b.id,
              matchesDetailId: db.id,
              similarity: s,
            });
          }
        }
      }
    }

    return { claims, matches };
  }

  return { score, similarity };
}

/** Ready to use, with the default keyword extractor. */
export const scorer: Scorer = createScorer();
