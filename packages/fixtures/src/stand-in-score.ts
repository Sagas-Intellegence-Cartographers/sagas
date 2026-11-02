/**
 * An invented stand-in for the intelligence layer's scorer, in the shape it
 * returns.
 *
 * It exists so the fixtures have scores to order claims and details by, in
 * exactly the shape a real scorer produces (`claimScore` in the contract). A
 * page built against it keeps working when the real scorer replaces it. The
 * numbers mean nothing: don't copy the arithmetic, and don't build anything
 * that depends on a particular value.
 *
 * It does follow the model's rules, because a stand-in that broke them would
 * teach the wrong thing:
 *   - weight comes from evidence and independent support, never volume;
 *   - "sounds right" adds almost nothing;
 *   - there's no ranking by source type or by domain;
 *   - a translated claim never scores lower for being translated;
 *   - until a claim's own content can be read (it's awaiting translation, or
 *     the window of a recording it cites has no transcript), the part of its
 *     score that comes from the claim itself waits, and it keeps what it gets
 *     from evidence and behaviour.
 */
import type {
  Claim, ClaimDetail, ClaimScore, DetailScore, DisputeEdge, ExtensionEdge, ScoreTerm,
  SourceRecord, SupportingRecord, TimeWindow,
} from '@sagas/contracts';

export interface StandInInputs {
  claim: Claim;
  details: ClaimDetail[];
  /** The evidence records on another claim. */
  evidenceOf: (claimId: string) => string[];
  sourceRecord: SourceRecord;
  transcripts: SupportingRecord[];
  disputes: DisputeEdge[];
  extensions: ExtensionEdge[];
  independentRecordCount: number;
  soundsRight: number;
}

function covered(window: TimeWindow | undefined, transcripts: SupportingRecord[]): boolean {
  if (transcripts.some((t) => !t.parent.window)) return true;
  if (!window) return transcripts.length > 0;
  return transcripts.some((t) => t.parent.window && t.parent.window.start <= window.start && t.parent.window.end >= window.end);
}

/** Whether the claim's own content can be read yet. */
export function contentReadable(i: Pick<StandInInputs, 'claim' | 'sourceRecord' | 'transcripts'>): boolean {
  if (i.claim.awaitingTranslation) return false;
  const isRecording = i.sourceRecord.media.some((m) => m.kind === 'audio' || m.kind === 'video');
  const window = i.claim.target.sourceType === 'record' ? i.claim.target.window : undefined;
  if (!isRecording || window === undefined) return true;
  const own = i.transcripts.filter((t) => t.parent.recordId === i.sourceRecord.id);
  return covered(window, own);
}

const t = (family: ScoreTerm['family'], name: string, value: number): ScoreTerm => ({ family, name, value });

export function standInScore(i: StandInInputs): ClaimScore {
  const readable = contentReadable(i);

  const terms: ScoreTerm[] = [
    t('content', 'base', 1),
    t('content', 'evidence attached', 0.5 * i.claim.evidence.length),
    t('content', 'independent support', 2 * i.independentRecordCount),
    t('behaviour', 'sounds right', 0.05 * Math.min(i.soundsRight, 6)),
  ];
  if (readable) {
    terms.push(
      t('content', 'extensions', 0.75 * Math.min(i.extensions.length, 4)),
      t('content', 'disputes', -0.5 * i.disputes.length),
    );
  }

  const details: DetailScore[] = i.details.map((d) => {
    const dTerms: ScoreTerm[] = [t('content', 'base', 1)];
    const extensions = i.extensions.filter((e) => e.targetExcerpt === d.excerpt);
    const disputes = i.disputes.filter((e) => e.targetExcerpt === d.excerpt);
    if (readable) {
      dTerms.push(t('content', 'extensions', 0.75 * extensions.length), t('content', 'disputes', -0.5 * disputes.length));
    }
    const score = Math.max(0.25, dTerms.reduce((sum, x) => sum + x.value, 0));
    const claimIds = [...disputes.map((e) => e.fromClaimId), ...extensions.map((e) => e.childClaimId)];
    return {
      detailId: d.id, excerpt: d.excerpt, score, terms: dTerms, contested: disputes.length > 0, claimIds,
      evidenceRecordIds: [...new Set([
        ...claimIds.flatMap(i.evidenceOf),
        ...i.claim.evidence.filter((e) => e.excerpt === d.excerpt).map((e) => e.recordId),
      ])],
    };
  });

  const score = Math.max(0.25, terms.reduce((sum, x) => sum + x.value, 0));
  return { claimId: i.claim.id, score, terms, details };
}

export type Confidence = 'single_source' | 'corroborated' | 'well_corroborated' | 'contested';

export function classifyConfidence(i: { independentRecordCount: number; disputeCount: number }): Confidence {
  if (i.disputeCount > 0) return 'contested';
  if (i.independentRecordCount >= 3) return 'well_corroborated';
  if (i.independentRecordCount >= 1) return 'corroborated';
  return 'single_source';
}
