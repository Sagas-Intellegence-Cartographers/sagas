import type { ClaimState } from '@sagas/contracts';

/**
 * A claim given in another language, and how it's been rendered into English.
 *
 * TODO: three states to handle, and the first is the one people forget.
 *
 * - No rendering yet. The claim is pinned, readable in the original, and
 *   `text` is empty. Show the original. Show that a rendering is wanted. Do not
 *   hide it, do not sort it to the bottom, do not render an empty row.
 * - One rendering. Show it, credited, with the original reachable.
 * - Several renderings. They coexist, and none is the correct one. If someone has
 *   objected that a rendering loses something, that objection stays attached to
 *   both versions.
 *
 * A reader who doesn't speak the original language should still be able to see that two people
 * disagree about what a sentence means.
 *
 * Acceptance criteria: claim-outside-the-graph, rendering-arrives,
 * coexisting-renderings.
 */
export function TranslationPanel({ claim }: { claim: ClaimState }) {
  if (claim.claim.awaitingTranslation) {
    return <div>TODO: original text, no rendering yet, invite one</div>;
  }
  if (claim.translations.length > 1) {
    return <div>TODO: {claim.translations.length} renderings, each credited</div>;
  }
  return null;
}
