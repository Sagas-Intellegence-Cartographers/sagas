import type { GraphState } from '@sagas/contracts';
import { SiteHeader } from '../site/SiteHeader';
import { ClaimView } from './ClaimView';
import { VersionTimeline } from './VersionTimeline';

/**
 * The article, which is the main view: everything known about a place, read
 * as prose rather than inspected as a graph. A historian should be able to read it start to finish and also see
 * which parts are solid.
 *
 * Claims arrive ordered by weight, strongest first. Keep that order. It is how
 * the strongest reading leads without anything being marked "accepted".
 *
 * TODO: this is a list of claims right now. It has to become something that
 * reads. Extensions belong woven in near what they extend, not appended.
 */
export function ArticleView({ state }: { state: GraphState }) {
  return (
    <main>
      <SiteHeader state={state} />
      <VersionTimeline state={state} />
      {/* Dispute claims show under the claim they dispute, not as entries of their own. */}
      {state.claims.filter((c) => !c.claim.disputedClaimId).map((c) => (
        <ClaimView key={c.claim.id} claim={c} />
      ))}
    </main>
  );
}
