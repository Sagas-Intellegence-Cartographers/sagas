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

  // Prompted by: "Who can make a home's location exact?"
  // in docs/DESIGN-QUESTIONS.md. Homes show at neighborhood level by
  // default; who may opt a home in to its exact spot is open. The content
  // layer's side is who can ask; this side is what the map draws.
  it.todo("shows a home at neighborhood level until its people opt in");
});

describe('capture and page: open questions', () => {
  // Prompted by: "Is the unit of work a task?" in docs/DESIGN-QUESTIONS.md. Routing now
  // sits with the experience layer. Open: overlaps "Is every ask in the system one kind
  // of object?".
  it.todo('routes an open task to someone able to answer it');

  // Prompted by: "What should happen when someone repeats what's already here?" in
  // docs/DESIGN-QUESTIONS.md. Open: how a page collapses repeats, and how explore mode
  // uses what a thread has already said.
  it.todo('shows repeats together and leads a person to the existing thread');

  // Prompted by: "How do you tell whether a reply is about what it targets?"
  // in docs/DESIGN-QUESTIONS.md. A detail is an excerpt another claim points at.
  // Open: how a reply selects that excerpt.
  it.todo('lets a reply select the excerpt of a claim it targets');
});

describe('shared contract: open questions', () => {
  // Prompted by: "Which text does an excerpt count into?" in docs/DESIGN-QUESTIONS.md.
  // Open: which text an excerpt counts into when a claim wasn't given in English.
  it.todo('lets an excerpt point into the text a claim was given in');

  // Prompted by: "Every id is just `string`"
  // in docs/DESIGN-QUESTIONS.md. Answerable with a pull request.
  it.todo('a claim id cannot be passed where a contributor id belongs');

  // Prompted by: "`translationDispute` and a dispute claim are the same idea"
  // in docs/DESIGN-QUESTIONS.md. Answerable with a pull request.
  it.todo('a translation dispute and a dispute claim share one shape');

  // Prompted by: "Can a web page be the record a conversation starts from?"
  // in docs/DESIGN-QUESTIONS.md. Links are decided as evidence; contract
  // 2.4.0 allows a link on any record, so this is open, not permitted.
  it.todo('a web page as the record a conversation starts from');
});
