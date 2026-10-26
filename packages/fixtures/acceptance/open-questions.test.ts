/**
 * Open design questions that belong to the experience layer, and the ones about
 * the shape of the shared contract, as placeholder tests.
 *
 * Each names what a test would check once the question is answered, so the
 * question stays visible every time the acceptance suite runs. The questions
 * themselves are in docs/DESIGN-QUESTIONS.md. The intelligence layer's are in
 * packages/fixtures/scoring/rules.ts and the content layer's in
 * packages/fixtures/capture/rules.ts.
 */
import { describe, it } from 'vitest';

describe('experience layer: open questions', () => {
  // Prompted by: "What does an interface do with "sometime in the fifties, probably"?"
  // in docs/DESIGN-QUESTIONS.md. Open: showing a vague date without inventing
  // precision or hiding it.
  it.todo('shows a vague date as vague, without turning it into a year');

  // Prompted by: "Does disputing a claim feel like disputing the person who wrote it?"
  // in docs/DESIGN-QUESTIONS.md. Open: a dispute lands on a detail, and the
  // interface should make that visible.
  it.todo('shows a dispute against a detail, never against the person');

  // Prompted by: "Should a contributor see why their claim ranks where it does?"
  // in docs/DESIGN-QUESTIONS.md. Open: explaining order without showing a score.
  it.todo('explains why a claim is shown where it is without showing a number');

  // Prompted by: "What makes a place significant?"
  // in docs/DESIGN-QUESTIONS.md. Open: how a place comes to be on the map, and
  // how one place points at another.
  it.todo('lets a claim point at another place without merging the two');

  // Prompted by: "Is every ask in the system one kind of object?"
  // in docs/DESIGN-QUESTIONS.md. Open: requests by type and direction.
  it.todo('shows an open request on the claim or record it asks about');
});

describe('shared contract: open questions', () => {
  // Prompted by: "The edge types are copy-pasted"
  // in docs/DESIGN-QUESTIONS.md. Answerable with a pull request.
  it.todo('the edge types share one base shape');

  // Prompted by: "Every id is just `string`"
  // in docs/DESIGN-QUESTIONS.md. Answerable with a pull request.
  it.todo('a claim id cannot be passed where a contributor id belongs');

  // Prompted by: "`translationDispute` and `disputeEdge` are the same idea"
  // in docs/DESIGN-QUESTIONS.md. Answerable with a pull request.
  it.todo('a translation dispute and a dispute edge share one shape');

  // Prompted by: "A transcript and a translation are the same kind of thing"
  // in docs/DESIGN-QUESTIONS.md. Decided as one class of supporting record;
  // held for its own release.
  it.todo('transcripts and translations are one class of supporting record');
});
