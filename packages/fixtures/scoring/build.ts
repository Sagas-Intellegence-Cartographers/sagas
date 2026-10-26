/**
 * A small builder so each rule reads as a few lines of graph.
 *
 *   graph()
 *     .record('r1', { by: 'p1', kind: 'audio' })
 *     .claim('A', { by: 'p1', source: 'r1', details: { year: '1950', place: 'Mill Road' } })
 *     .claim('C', { by: 'p3', source: 'r3', details: { year: '1960' } })
 *     .dispute('C', 'A', 'year', "Mill Road wasn't built until 1958")
 *     .build();
 *
 * Profiles are created as guests the first time someone is named with `by`.
 * Every event gets its own minute, in the order it was written, unless you
 * give it a time. Records named as a source or as evidence must be added with
 * `.record` first.
 */
import type {
  ClaimNode,
  Detail,
  Edge,
  Passover,
  Profile,
  RecordNode,
  ScoringGraph,
} from "./graph";
import { scoringGraph } from "./graph";

const START = Date.parse("2026-01-01T00:00:00Z");
const MINUTE = 60_000;

const KIND_BY_KEY: Record<string, Detail["kind"]> = {
  year: "date",
  date: "date",
  when: "date",
  place: "place",
  road: "place",
  where: "place",
  person: "person",
  who: "person",
  name: "person",
  count: "quantity",
  quantity: "quantity",
  said: "attribution",
};

interface RecordOptions {
  by: string;
  kind?: RecordNode["kind"];
  at?: string;
  transcribed?: boolean;
  /** Stretches with a transcript, in seconds. */
  transcribedWindows?: { start: number; end: number }[];
  hash?: string;
  location?: { lat: number; lng: number };
}

interface ClaimOptions {
  by: string;
  source: string;
  /** Detail key to text. The key becomes the detail's id within this claim. */
  details: Record<string, string>;
  text?: string;
  at?: string;
  /** Record ids, or record id with the detail key it backs. */
  evidence?: (string | { record: string; detail: string })[];
  /** The part of a recording it comes from, in seconds. */
  window?: { start: number; end: number };
  /** Given in another language and rendered. */
  translated?: boolean;
}

export class GraphBuilder {
  private minute = 0;
  private readonly records: RecordNode[] = [];
  private readonly claims: ClaimNode[] = [];
  private readonly edges: Edge[] = [];
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
      ...(o.location !== undefined && { location: o.location }),
    });
    return this;
  }

  claim(id: string, o: ClaimOptions): this {
    const details: Detail[] = Object.entries(o.details).map(([key, value]) => ({
      id: key,
      kind: KIND_BY_KEY[key] ?? "event",
      value,
      excerpt: value,
    }));
    this.claims.push({
      id,
      contributorId: this.person(o.by),
      createdAt: this.tick(o.at),
      text: o.text ?? Object.values(o.details).join(", "),
      sourceRecordId: o.source,
      ...(o.window !== undefined && { sourceWindow: o.window }),
      ...(o.translated !== undefined && { translated: o.translated }),
      details,
      evidence: (o.evidence ?? []).map((e) =>
        typeof e === "string"
          ? { recordId: e }
          : { recordId: e.record, detailId: e.detail },
      ),
    });
    return this;
  }

  dispute(
    fromClaimId: string,
    toClaimId: string,
    toDetailId: string,
    reason: string,
  ): this {
    this.edges.push({
      type: "dispute",
      fromClaimId,
      toClaimId,
      toDetailId,
      reason,
    });
    return this;
  }

  extend(fromClaimId: string, toClaimId: string, toDetailId?: string): this {
    this.edges.push({
      type: "extension",
      fromClaimId,
      toClaimId,
      ...(toDetailId !== undefined && { toDetailId }),
    });
    return this;
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
    const claimIds = new Set(this.claims.map((c) => c.id));
    for (const c of this.claims) {
      if (!recordIds.has(c.sourceRecordId))
        throw new Error(`claim ${c.id}: no record ${c.sourceRecordId}`);
      for (const e of c.evidence) {
        if (!recordIds.has(e.recordId))
          throw new Error(`claim ${c.id}: no record ${e.recordId}`);
      }
    }
    for (const e of this.edges) {
      if (!claimIds.has(e.fromClaimId) || !claimIds.has(e.toClaimId)) {
        throw new Error(
          `${e.type} ${e.fromClaimId} -> ${e.toClaimId}: unknown claim`,
        );
      }
    }
    return scoringGraph.parse({
      siteId: this.siteId,
      asOf:
        this.asOf ??
        new Date(START + (this.minute + 60) * MINUTE).toISOString(),
      records: this.records,
      claims: this.claims,
      edges: this.edges,
      passovers: this.passoverList,
      profiles: [...this.profiles.values()],
    });
  }
}

export const graph = (siteId = "site-test", asOf?: string): GraphBuilder =>
  new GraphBuilder(siteId, asOf);
