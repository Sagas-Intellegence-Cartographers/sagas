/**
 * What a scorer reads and what it returns.
 *
 * A list of counts can't say which detail a dispute landed on, whether two
 * claims came from the same record, or who brought what, and those are most
 * of what scoring is about. So the scorer reads the graph itself. The shapes
 * it returns (`claimScore` and its terms) come from `@sagas/contracts`, so the
 * experience layer renders exactly what a scorer produces.
 *
 * This is the input the intelligence layer can expect to have. How it plugs
 * into a scorer (your own structures, your own tables, things worked out from
 * it first) is the scorer's business. The rules fix only what goes in and what
 * comes out.
 */
import { z } from "zod";

import type { ClaimDetail } from "@sagas/contracts";
import {
  claimEvidence,
  claimReference,
  claimScore,
  claimTarget,
  detailId,
  detailScore,
  scoreTerm,
} from "@sagas/contracts";

const timestamp = z.string().datetime();

/** Something a person handed over. Its role (source or evidence) comes from how claims use it. */
export const recordNode = z.object({
  id: z.string(),
  contributorId: z.string(),
  kind: z.enum(["audio", "video", "image", "document", "text", "link"]),
  createdAt: timestamp,
  /**
   * Audio and video only. False means nobody can read its subject matter yet,
   * so nothing that depends on what it says can come from it.
   */
  transcribed: z.boolean().optional(),
  /**
   * Audio and video only: the stretches that have a transcript, in seconds.
   * A claim citing a window that isn't covered gets nothing yet from the
   * part of its score that depends on what it says.
   */
  transcribedWindows: z
    .array(z.object({ start: z.number(), end: z.number() }))
    .optional(),
  /** The same file handed over twice has the same hash. */
  contentHash: z.string().optional(),
  /**
   * Where the record was made, from the photo's metadata, when the person
   * chose to keep it. Raw coordinates for now. People choose whether to keep
   * the location, show only its distance from the place, or remove it, so
   * this will often be missing and its shape may change.
   */
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});
export type RecordNode = z.infer<typeof recordNode>;

export const claimNode = z.object({
  id: z.string(),
  contributorId: z.string(),
  createdAt: timestamp,
  text: z.string(),
  /** The record this claim's thread starts from. Claims with the same one are one thread. */
  sourceRecordId: z.string(),
  /** What this claim points at: part of a record, or part of another claim. */
  target: claimTarget,
  /**
   * True when the claim was given in another language and rendered. It must
   * never lower a score; the rules check that. There's no field for where a
   * contributor lives, so distance can't lower a score either.
   */
  translated: z.boolean().optional(),
  /** Typed links inside the claim's text. Nothing scores them yet. */
  references: z.array(claimReference),
  /**
   * Records attached to back the claim up. `excerpt` is for evidence that backs
   * particular words in this claim's own text, and naming one makes those words a
   * detail. If a claim targets an evidence record, that starts a new thread with
   * that record as its source.
   */
  evidence: z.array(claimEvidence),
});
export type ClaimNode = z.infer<typeof claimNode>;

/**
 * A claim pointing at an excerpt of another claim. The people who write claims
 * choose these targets, so the scorer never has to guess them from the words.
 * Resolution is left out until what it points at is decided.
 */
export const edge = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("dispute"),
    fromClaimId: z.string(),
    toClaimId: z.string(),
    excerpt: z.string().min(1),
    reason: z.string().min(1),
  }),
  z.object({
    type: z.literal("extension"),
    fromClaimId: z.string(),
    toClaimId: z.string(),
    /** Optional only for an extension about the whole claim. */
    excerpt: z.string().min(1).optional(),
  }),
]);
export type Edge = z.infer<typeof edge>;

/**
 * A light signal a reader leaves on a claim. Not a vote. These are frequent
 * and light, so they may end up arriving through their own endpoint as they
 * happen, with scoring reading running totals. They're in the graph for now so
 * the rules can test what they do.
 */
export const passover = z.object({
  claimId: z.string(),
  contributorId: z.string(),
  kind: z.enum(["sounds_right", "dont_know", "dont_care"]),
  createdAt: timestamp,
});
export type Passover = z.infer<typeof passover>;

/**
 * Who contributed. A guest profile is the normal case. What a profile has done
 * is in the graph above; who they are is never here.
 */
export const profile = z.object({
  id: z.string(),
  guest: z.boolean(),
});
export type Profile = z.infer<typeof profile>;

export const scoringGraph = z.object({
  siteId: z.string(),
  /** "Now", for anything measured in time. */
  asOf: timestamp,
  records: z.array(recordNode),
  claims: z.array(claimNode),
  edges: z.array(edge),
  passovers: z.array(passover),
  profiles: z.array(profile),
});
export type ScoringGraph = z.infer<typeof scoringGraph>;

/**
 * A claim's details, worked out from what points at it: the excerpts other claims
 * target, and any excerpt its own evidence names. The same words are the same
 * detail, and a claim nothing points at has none. Your score has one result for
 * each of these, with this id.
 */
export function detailsOf(graph: ScoringGraph, claimId: string): ClaimDetail[] {
  const fromEdges = graph.edges.flatMap((e) =>
    e.toClaimId === claimId && e.excerpt !== undefined ? [e.excerpt] : [],
  );
  const fromEvidence = (
    graph.claims.find((c) => c.id === claimId)?.evidence ?? []
  ).flatMap((e) => (e.excerpt !== undefined ? [e.excerpt] : []));
  return [...new Set([...fromEdges, ...fromEvidence])].map((excerpt) => ({
    id: detailId(claimId, excerpt),
    excerpt,
  }));
}

/* ------------------------------------------------------------------ */
/* What comes back                                                      */
/* ------------------------------------------------------------------ */

/** The score shapes are the contract's, so a scorer and a page agree. */
export const term = scoreTerm;
export type Term = z.infer<typeof term>;
export { detailScore, claimScore, detailId };
export type DetailScore = z.infer<typeof detailScore>;
export type ClaimScore = z.infer<typeof claimScore>;

/**
 * A detail of one claim that looks like what a claim in another thread says. For
 * this semester a match counts straight away, with the weight coming from the
 * records behind it. That's a temporary choice. Whether a person should confirm
 * first is a question for next semester.
 */
export const match = z.object({
  claimId: z.string(),
  detailId: z.string(),
  matchesClaimId: z.string(),
  similarity: z.number().min(0).max(1),
});
export type Match = z.infer<typeof match>;

export const scoringResult = z.object({
  claims: z.array(claimScore),
  matches: z.array(match),
});
export type ScoringResult = z.infer<typeof scoringResult>;

/** What you build. */
export interface Scorer {
  score(graph: ScoringGraph): ScoringResult;
  /** How alike two pieces of text are, from 0 to 1. */
  similarity(a: string, b: string): number;
}
