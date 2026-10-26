/**
 * How well supported one claim is.
 *
 * ---
 *
 * WORKED EXAMPLE, like IntegrityBadge. Copy the structure. The styling is a
 * placeholder to replace.
 *
 * ---
 *
 * WHY AN AGREEMENT COUNT IS NEVER SHOWN ON ITS OWN
 *
 * Agreement is not corroboration.
 *
 * A claim can have five "sounds right" passovers and zero independent support,
 * because agreeing is not bringing anything. Support comes from somebody else
 * putting a record of their own behind the claim. Five people saying "sounds
 * right" is five reactions to one source.
 *
 * So this never shows an agreement count on its own. "5 agree" next to
 * "single source" looks like a contradiction, and "5 agree" without the
 * qualifier reads as support that is not there.
 *
 * `cl-afterhours` at t3 is the case: two "sounds right" passovers, zero independent
 * sources, still single_source. Open `pnpm inspect --state t3 cl-afterhours`
 * and look.
 *
 * Acceptance criterion: affirmation-without-independence.
 *
 * WHY "CONTESTED" IS NOT RED
 *
 * This project reads "contested" as a sign that a claim matters enough for
 * somebody to argue. Nothing here should make it look like a failure, which is
 * why there is no red.
 *
 * TODO for whoever takes this further: a historian probably wants something
 * subtler than a label, which they can take in while skimming a paragraph
 * without the page looking like a dashboard. Margin marks, a weight in the
 * type or something on hover are all options. This version gets the rule right
 * and is not the finished design.
 */

import type { ClaimState } from '@sagas/contracts';

const LABELS: Record<ClaimState['confidence'], string> = {
  single_source: 'One source',
  corroborated: 'Corroborated',
  well_corroborated: 'Well corroborated',
  contested: 'Contested',
};

/**
 * How support should be described, given the two numbers that matter.
 *
 * A pure function, separate from the markup, so the rule can be tested
 * without rendering anything.
 */
export function supportSummary(independentRecordCount: number, affirmationCount: number): string {
  if (independentRecordCount === 0 && affirmationCount === 0) {
    return 'No one else has spoken to this yet';
  }
  if (independentRecordCount === 0) {
    // The case this component exists for: people agreed, and nobody brought a record.
    return affirmationCount === 1
      ? '1 person agrees, with no independent record yet'
      : `${affirmationCount} people agree, with no independent record yet`;
  }
  const records = independentRecordCount === 1 ? '1 other record' : `${independentRecordCount} other records`;
  return `Backed by ${records}`;
}

export function ConfidenceIndicator({ claim }: { claim: ClaimState }) {
  if (claim.claim.awaitingTranslation) {
    return (
      <p className="text-xs text-neutral-600">
        Not yet rendered into English. Nothing can corroborate it until somebody does.
      </p>
    );
  }

  const summary = supportSummary(claim.independentRecordCount, claim.passover.sounds_right);

  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
      <span className="font-medium text-neutral-800">{LABELS[claim.confidence]}</span>
      <span className="text-neutral-400" aria-hidden="true">
        ·
      </span>
      <span className="text-neutral-600">{summary}</span>
    </p>
  );
}
