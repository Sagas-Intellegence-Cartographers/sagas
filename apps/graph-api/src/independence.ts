/**
 * Independence: which records really stand behind one detail of a claim.
 *
 * This is Stage 2 of `docs/Pseudo_Code_Model.md`, built against the graph.
 * It counts records, as your pseudo-code does. It skips the person's own
 * records, the claim's own source, and the same file handed over twice. Your
 * fourth skip, a record that's the source of a claim further down, shouldn't
 * come up, because a reply's source is its thread's source. The graph doesn't
 * enforce that, and this doesn't check it. It doesn't return your "could not be
 * judged" count yet. It adds the part the graph makes possible, which is the
 * same thing being said in another thread.
 *
 * A detail is an excerpt of a claim that another claim points at, and a thread is
 * the claims with one source record. So independence shows up as details appear: a
 * claim nothing points at has no details, and nothing to corroborate yet.
 *
 * The claim's own source is what the claim stands on, so it isn't counted as
 * independent support for it. How much the source itself is worth is your
 * scorer's call.
 *
 * It doesn't score anything. Your scorer calls it, turns what comes back into
 * terms, and decides what each record is worth. `similarity` is yours too:
 * this file only asks it whether another claim says the same thing as the excerpt.
 *
 * Two refinements are waiting for you, each with a placeholder rule. It can't tell a denial
 * from support, so a claim saying "it was not 1950" counts for the detail "1950" if your
 * `similarity` passes it. And a reply pointing at a longer excerpt doesn't count toward the
 * details inside it, while a dispute of one does contest them.
 *
 * Its own tests are in `independence.test.ts`.
 */
import type { Excerpt } from "@sagas/contracts";
import type { ClaimNode, RecordNode, ScoringGraph } from "@sagas/fixtures/scoring";
import { pointsAt } from "@sagas/fixtures/scoring";

/** A record counted as independent support for the detail. */
export interface CountedRecord {
  recordId: string;
  /** The claim that brought it. */
  claimId: string;
  /** How it reaches the detail. */
  via: "extension" | "another thread";
}

/** A record left out, with the reason, so your terms can say why. */
export interface SkippedRecord {
  recordId: string;
  claimId: string;
  reason: "same person" | "already counted" | "copy";
}

export interface Independence {
  counted: CountedRecord[];
  skipped: SkippedRecord[];
}

/**
 * What one place's graph looks like once it's been indexed. Build it once with
 * `placeIndex` and pass it to every call, so scoring a place doesn't repeat the work.
 */
export interface PlaceIndex {
  claims: Map<string, ClaimNode>;
  records: Map<string, RecordNode>;
  /** The claims that reply to each claim. */
  replies: Map<string, ClaimNode[]>;
  /** The claims each word appears in, by position in the graph. */
  words: Map<string, number[]>;
  /** The claims in graph order, for reading `words`. */
  order: ClaimNode[];
}

export function placeIndex(graph: ScoringGraph): PlaceIndex {
  const replies = new Map<string, ClaimNode[]>();
  const words = new Map<string, number[]>();
  graph.claims.forEach((claim, position) => {
    const { claimId } = claim.target;
    if (claimId !== undefined) {
      const list = replies.get(claimId) ?? [];
      list.push(claim);
      replies.set(claimId, list);
    }
    for (const word of new Set(wordsOf(claim.text))) {
      const list = words.get(word) ?? [];
      list.push(position);
      words.set(word, list);
    }
  });
  return {
    claims: new Map(graph.claims.map((c) => [c.id, c])),
    records: new Map(graph.records.map((r) => [r.id, r])),
    replies,
    words,
    order: graph.claims,
  };
}

/**
 * The claims worth asking `similarity` about: the ones that share a word with the
 * excerpt. A word in most of the place's claims, like "the", narrows nothing, so it
 * only counts when the excerpt has no rarer word.
 *
 * This finds candidates and decides nothing, and how alike they are is still
 * `similarity`'s call. A claim that says the same thing in entirely different words
 * ("burned down" and "a fire took it") never reaches `similarity` this way.
 * Reference values can narrow by meaning instead, once claims have references. That
 * and the alikeness score are on the spring list.
 */
function candidates(index: PlaceIndex, excerpt: string): ClaimNode[] {
  const found = wordsOf(excerpt).flatMap((word) => {
    const positions = index.words.get(word);
    return positions ? [positions] : [];
  });
  const rare = found.filter((p) => p.length <= index.order.length / 2);
  const positions = new Set((rare.length > 0 ? rare : found).flat());
  return [...positions]
    .sort((a, b) => a - b)
    .flatMap((p) => {
      const claim = index.order[p];
      return claim ? [claim] : [];
    });
}

export interface IndependenceOptions {
  /**
   * How alike an excerpt and another claim's text have to be to count as saying
   * the same thing. The 0.8 is a placeholder. Tune it against your own similarity.
   */
  threshold?: number;
  /** The place's index. Pass the same one to every call when you score a whole place. */
  index?: PlaceIndex;
}

export function independence(
  graph: ScoringGraph,
  claimId: string,
  excerpt: Excerpt,
  /**
   * Called with a short excerpt and a whole claim's text, so it has to measure how much of
   * the excerpt appears in that text. The guide's longest common subsequence over the shorter
   * length does this. A measure that counts both sides equally would rarely reach 0.8.
   */
  similarity: (a: string, b: string) => number,
  options: IndependenceOptions = {},
): Independence {
  const threshold = options.threshold ?? 0.8;
  const index = options.index ?? placeIndex(graph);

  const claim = index.claims.get(claimId);
  if (!claim) throw new Error(`no claim ${claimId} in the graph`);
  const replies = index.replies.get(claimId) ?? [];
  const pointing = replies.filter((r) => pointsAt(r, excerpt));
  if (pointing.length === 0) {
    throw new Error(`nothing points at "${excerpt.text}" in claim ${claimId}`);
  }

  const counted: CountedRecord[] = [];
  const skipped: SkippedRecord[] = [];

  // The same file handed over twice is one record, so a record is known by its
  // hash when it has one.
  const recordOf = (recordId: string) => {
    const record = index.records.get(recordId);
    if (!record) throw new Error(`no record ${recordId} in the graph`);
    return record;
  };
  const fingerprint = (recordId: string): string => {
    const record = recordOf(recordId);
    return record.contentHash ?? record.id;
  };
  // The claim's own source is what it was read from, so it can't also be
  // support for it. Its evidence backs what it targets and not this detail, but a
  // thread leaning on the same record still isn't bringing anything new, so both
  // count as seen.
  const seen = new Set([
    fingerprint(claim.sourceRecordId),
    ...claim.evidence.map((e) => fingerprint(e.recordId)),
  ]);

  const consider = (
    recordId: string,
    from: ClaimNode,
    via: CountedRecord["via"],
  ): void => {
    const record = recordOf(recordId);
    // Nobody corroborates themselves: not by handing over the record, and not
    // by bringing someone else's record in a claim of their own.
    const ownClaim = from.contributorId === claim.contributorId;
    if (ownClaim || record.contributorId === claim.contributorId) {
      skipped.push({ recordId, claimId: from.id, reason: "same person" });
      return;
    }
    const key = fingerprint(recordId);
    if (seen.has(key)) {
      skipped.push({ recordId, claimId: from.id, reason: "already counted" });
      return;
    }
    seen.add(key);
    counted.push({ recordId, claimId: from.id, via });
  };

  // An extension's source should be the thread's source, which is already
  // seen, so only what the extension brings of its own counts. An extension
  // about the whole claim points at no detail, so it isn't counted here.
  for (const reply of pointing) {
    if (reply.relation !== "extension") continue;
    for (const e of reply.evidence) consider(e.recordId, reply, "extension");
  }

  // The same thing said in another thread is a second telling, so the records
  // behind it count, source included. Inside one thread, agreement goes through
  // the replies above instead.
  //
  // Temporary, for this semester: a match counts straight away, with nobody
  // confirming it. Whether a person should confirm first is a question for
  // spring.
  for (const other of candidates(index, excerpt.text)) {
    if (other.sourceRecordId === claim.sourceRecordId) continue;
    if (similarity(excerpt.text, other.text) < threshold) continue;
    const behind = [
      other.sourceRecordId,
      ...other.evidence.map((e) => e.recordId),
    ];
    // A word-for-word copy is one telling repeated, so nothing behind it
    // counts. A near-perfect match points to a copy too, but only identical
    // wording is caught here. How near counts as a copy is your design. Two
    // people can both write just "1950" and neither has copied, so very short
    // claims are never treated as copies.
    const said = wordsOf(claim.text).join(" ");
    if (
      other.contributorId !== claim.contributorId &&
      said.split(" ").length >= 3 &&
      wordsOf(other.text).join(" ") === said
    ) {
      for (const recordId of behind)
        skipped.push({ recordId, claimId: other.id, reason: "copy" });
      continue;
    }
    for (const recordId of behind) consider(recordId, other, "another thread");
  }

  return { counted, skipped };
}

function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}
