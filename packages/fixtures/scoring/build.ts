/**
 * A small builder so each rule reads as a few lines of graph.
 *
 *   graph()
 *     .record('r1', { by: 'p1', kind: 'audio' })
 *     .claim('A', { by: 'p1', source: 'r1', text: '1950, Mill Road' })
 *     .claim('C', { by: 'p3', source: 'r1', text: '1960' })
 *     .dispute('C', 'A', { at: '1950', to: '1960' }, "Mill Road wasn't built until 1958")
 *     .build();
 *
 * `extend` takes the words it points at, as a string or a list. `dispute` takes
 * `{ at, to }`, or a list of them, because a dispute says what replaces those words: `to`
 * is words in the reply's own text. Add `occurrence` to pick a repeat of `at`. Leave them
 * out for a reply about the whole claim. The builder finds the positions, so you never
 * count characters.
 *
 * Profiles are created as guests the first time someone is named with `by`.
 * Every event gets its own minute, in the order it was written, unless you
 * give it a time. Records named as a source or as evidence must be added with
 * `.record` first.
 */
import type { ClaimReference, RecordParent, TargetDetail } from "@sagas/contracts";
import { findExcerpt } from "@sagas/contracts";

import type {
  Passover,
  Profile,
  RecordNode,
  ScoringGraph,
} from "./graph";
import { scoringGraph } from "./graph";

const START = Date.parse("2026-01-01T00:00:00Z");
const MINUTE = 60_000;

interface RecordOptions {
  by: string;
  kind?: RecordNode["kind"];
  at?: string;
  transcribed?: boolean;
  /** Stretches with a transcript, in seconds. */
  transcribedWindows?: { start: number; end: number }[];
  hash?: string;
  /** What it supports, for a transcript or a translation. It can then be disputed. */
  parent?: RecordParent;
  location?: { lat: number; lng: number };
}

interface ClaimOptions {
  by: string;
  source: string;
  text: string;
  at?: string;
  /** Record ids. They back what the claim targets. */
  evidence?: string[];
  /** The stretch of its source record it points at, in seconds. */
  window?: { start: number; end: number };
  /** Given in another language and rendered. */
  translated?: boolean;
  /** The words each reference marks in this claim's text. */
  references?: (Omit<ClaimReference, "excerpt"> & { excerpt: string })[];
}

/** Words in the target an extension points at. */
export type ExtensionOption = string | { at: string; occurrence?: number };
/** Words in the target a dispute points at, and the words in the reply that replace them. */
export interface DisputeOption {
  at: string;
  to: string;
  occurrence?: number;
}

const listOf = <T>(x: T | T[] | undefined): T[] =>
  x === undefined ? [] : Array.isArray(x) ? x : [x];

/** A claim while it's being built. `build` checks it against the schema. */
interface Draft {
  id: string;
  contributorId: string;
  createdAt: string;
  text: string;
  sourceRecordId: string;
  target: { claimId?: string; recordId?: string; details: TargetDetail[] };
  relation: "dispute" | "extension";
  reasoning?: string;
  references: ClaimReference[];
  translated?: boolean;
  evidence: { recordId: string }[];
}

export class GraphBuilder {
  private minute = 0;
  private readonly records: RecordNode[] = [];
  private readonly claims: Draft[] = [];
  private readonly pending: {
    claim: Draft;
    relation: "dispute" | "extension";
    targetId: string;
    details: (ExtensionOption | DisputeOption)[];
    reasoning?: string;
  }[] = [];
  private readonly passoverList: Passover[] = [];
  private readonly profiles = new Map<string, Profile>();

  constructor(
    private readonly siteId: string,
    private asOf?: string,
  ) {}

  private tick(at?: string): string {
    this.minute += 1;
    return at ?? new Date(START + this.minute * MINUTE).toISOString();
  }

  private person(id: string): string {
    if (!this.profiles.has(id)) this.profiles.set(id, { id, guest: true });
    return id;
  }

  record(id: string, o: RecordOptions): this {
    this.records.push({
      id,
      contributorId: this.person(o.by),
      kind: o.kind ?? "text",
      createdAt: this.tick(o.at),
      ...(o.transcribed !== undefined && { transcribed: o.transcribed }),
      ...(o.transcribedWindows !== undefined && {
        transcribedWindows: o.transcribedWindows,
      }),
      ...(o.hash !== undefined && { contentHash: o.hash }),
      ...(o.parent !== undefined && { parent: o.parent }),
      ...(o.location !== undefined && { location: o.location }),
    });
    return this;
  }

  /** A first claim points at its source record. `extend` and `dispute` repoint it. */
  claim(id: string, o: ClaimOptions): this {
    this.claims.push({
      id,
      contributorId: this.person(o.by),
      createdAt: this.tick(o.at),
      text: o.text,
      sourceRecordId: o.source,
      relation: "extension",
      target: {
        recordId: o.source,
        details: o.window !== undefined ? [{ at: o.window }] : [],
      },
      references: (o.references ?? []).map((r) => {
        const excerpt = findExcerpt(o.text, r.excerpt);
        if (!excerpt)
          throw new Error(`claim ${id}: "${r.excerpt}" isn't in its own text`);
        return { ...r, excerpt };
      }),
      ...(o.translated !== undefined && { translated: o.translated }),
      evidence: (o.evidence ?? []).map((recordId) => ({ recordId })),
    });
    return this;
  }

  private reply(
    replyId: string,
    targetId: string,
    relation: "dispute" | "extension",
    details: (ExtensionOption | DisputeOption)[],
    reasoning?: string,
  ): this {
    const claim = this.claims.find((c) => c.id === replyId);
    if (!claim) throw new Error(`${relation} from unknown claim ${replyId}`);
    this.pending.push({
      claim,
      relation,
      targetId,
      details,
      ...(reasoning !== undefined && { reasoning }),
    });
    return this;
  }

  /** Pass `undefined` for `details` to dispute the whole claim. */
  dispute(
    replyId: string,
    targetId: string,
    details: DisputeOption | DisputeOption[] | undefined,
    reasoning: string,
  ): this {
    return this.reply(replyId, targetId, "dispute", listOf(details), reasoning);
  }

  /** Dispute a transcript or a translation, which is a record with a parent. */
  disputeRecord(
    replyId: string,
    recordId: string,
    details: DisputeOption | DisputeOption[] | undefined,
    reasoning: string,
    text: string,
  ): this {
    const claim = this.claims.find((c) => c.id === replyId);
    if (!claim) throw new Error(`dispute from unknown claim ${replyId}`);
    const at = (d: DisputeOption): TargetDetail => {
      const words = findExcerpt(text, d.at, d.occurrence);
      const to = findExcerpt(claim.text, d.to);
      if (!words) throw new Error(`reply ${replyId}: "${d.at}" isn't in the text of ${recordId}`);
      if (!to) throw new Error(`reply ${replyId}: "${d.to}" isn't in the text of ${replyId}`);
      return { at: words, to };
    };
    claim.target = {
      recordId,
      details: listOf(details).map(at),
    };
    claim.relation = "dispute";
    claim.reasoning = reasoning;
    return this;
  }

  /** Leave out `details` for an extension about the whole claim. */
  extend(
    replyId: string,
    targetId: string,
    details?: ExtensionOption | ExtensionOption[],
  ): this {
    return this.reply(replyId, targetId, "extension", listOf(details));
  }

  private resolve(
    reply: Draft,
    target: Draft,
    option: ExtensionOption | DisputeOption,
  ): TargetDetail {
    const o: { at: string; to?: string; occurrence?: number } =
      typeof option === "string" ? { at: option } : option;
    const at = findExcerpt(target.text, o.at, o.occurrence);
    if (!at)
      throw new Error(`reply ${reply.id}: "${o.at}" isn't in the text of ${target.id}`);
    if (o.to === undefined) return { at };
    const to = findExcerpt(reply.text, o.to);
    if (!to)
      throw new Error(`reply ${reply.id}: "${o.to}" isn't in the text of ${reply.id}`);
    return { at, to };
  }

  passover(
    claimId: string,
    by: string,
    kind: Passover["kind"] = "sounds_right",
    at?: string,
  ): this {
    this.passoverList.push({
      claimId,
      contributorId: this.person(by),
      kind,
      createdAt: this.tick(at),
    });
    return this;
  }

  /** Several people leave the same passover on one claim. */
  passovers(
    claimId: string,
    count: number,
    kind: Passover["kind"] = "sounds_right",
  ): this {
    for (let i = 0; i < count; i++)
      this.passover(claimId, `reader-${claimId}-${i}`, kind);
    return this;
  }

  build(): ScoringGraph {
    const recordIds = new Set(this.records.map((r) => r.id));
    for (const c of this.claims) {
      if (!recordIds.has(c.sourceRecordId))
        throw new Error(`claim ${c.id}: no record ${c.sourceRecordId}`);
      for (const e of c.evidence) {
        if (!recordIds.has(e.recordId))
          throw new Error(`claim ${c.id}: no record ${e.recordId}`);
      }
    }
    for (const p of this.pending) {
      const target = this.claims.find((c) => c.id === p.targetId);
      if (!target) {
        throw new Error(
          `${p.relation} ${p.claim.id} -> ${p.targetId}: unknown claim`,
        );
      }
      p.claim.target = {
        claimId: p.targetId,
        details: p.details.map((d) => this.resolve(p.claim, target, d)),
      };
      p.claim.relation = p.relation;
      if (p.reasoning !== undefined) p.claim.reasoning = p.reasoning;
    }
    return scoringGraph.parse({
      siteId: this.siteId,
      asOf:
        this.asOf ??
        new Date(START + (this.minute + 60) * MINUTE).toISOString(),
      records: this.records,
      claims: this.claims,
      passovers: this.passoverList,
      profiles: [...this.profiles.values()],
    });
  }
}

export const graph = (siteId = "site-test", asOf?: string): GraphBuilder =>
  new GraphBuilder(siteId, asOf);
