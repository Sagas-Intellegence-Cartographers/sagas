/**
 * A short label for each situation the record can be in.
 *
 * The reasoning is not here. It is in `packages/fixtures/README.md`, under
 * "What your interface has to handle", because it is prose and prose belongs in
 * a document rather than in a typed array pretending to be data.
 *
 * What is here is the minimum needed to show the right criteria next to the
 * right components on the /dev page: which snapshot exhibits the situation,
 * which claim or record to look at, and one line on what has to be true.
 *
 * These are direction, not specification. They say what must not happen. How
 * your interface satisfies them is your design, and most of what you build will
 * be things this list says nothing about.
 */

export type Severity = 'must' | 'should';

export interface AcceptanceCriterion {
  id: string;
  /** Which fixture site shows this, by directory name under `fixtures/`. */
  site: string;
  /** Which snapshot shows this. */
  stateId: 't0' | 't1' | 't2' | 't3';
  /** The claim, record or person to look at, when it is about one. */
  subject?: string;
  /** What is true of the data. */
  situation: string;
  /** What your interface has to do about it. */
  requirement: string;
  severity: Severity;
}

export const ACCEPTANCE_CRITERIA: AcceptanceCriterion[] = [
  {
    id: 'record-with-no-claim',
    site: 'corner-shop',
    stateId: 't0',
    subject: 'rec-cs-photo',
    situation: 'One photograph, with a note saying the contributor does not know when it was taken. No claims.',
    requirement: 'Show the record as a complete contribution and an early place, not as empty or broken.',
    severity: 'must',
  },
  {
    id: 'contribution-is-not-authorship',
    site: 'corner-shop',
    stateId: 't1',
    subject: 'cl-cs-shop',
    situation: 'The claim was made by somebody other than the person who handed over the photograph.',
    requirement: 'Credit both, each for what they did.',
    severity: 'must',
  },
  {
    id: 'evidence-is-not-the-source',
    site: 'corner-shop',
    stateId: 't2',
    subject: 'cl-cs-uncle',
    situation: 'An extension whose source is the photograph and whose evidence is an audio clip.',
    requirement: 'Show what the claim is about (the photograph) and what backs it up (the clip) as different things.',
    severity: 'must',
  },
  {
    id: 'same-detail-separate-conversations',
    site: 'corner-shop',
    stateId: 't3',
    subject: 'cl-cs-sign',
    situation: 'A second conversation, from a different record, names the same owner. Nothing links the two.',
    requirement: 'Do not merge them or imply one confirms the other.',
    severity: 'should',
  },
  {
    id: 'sparse-site-is-not-empty-site',
    site: 'freight-depot',
    stateId: 't0',
    situation: 'Three claims, one contributor, nothing corroborated.',
    requirement: 'Read as a thin record, not a broken one or an error.',
    severity: 'must',
  },
  {
    id: 'affirmation-without-independence',
    site: 'corner-shop',
    stateId: 't1',
    subject: 'cl-cs-shop',
    situation: 'One "sounds right", and nobody has brought a record of their own. Independent records: 0.',
    requirement: 'Never show an agreement count as corroboration.',
    severity: 'must',
  },
  {
    id: 'claim-outside-the-graph',
    site: 'freight-depot',
    stateId: 't1',
    subject: 'cl-fd-ines',
    situation: 'A claim nobody has rendered into English yet. No text, no details; the part of its score that depends on what it says waits.',
    requirement: 'Show it, readable in the original. Do not skip it, crash on it, or sort it last.',
    severity: 'must',
  },
  {
    id: 'one-detail-disputed-others-not',
    site: 'corner-shop',
    stateId: 't2',
    subject: 'cl-cs-shop',
    situation: 'The year is disputed. The place and the owner are not.',
    requirement: 'Contest the year and only the year.',
    severity: 'must',
  },
  {
    id: 'competing-readings-shown-together',
    site: 'corner-shop',
    stateId: 't2',
    subject: 'cl-cs-shop',
    situation: '"c. 1950" from the claim, "1956 or later" from a dispute that cites a directory page.',
    requirement: 'Show both with their reasoning. No winner, nothing hidden, not a vote tally.',
    severity: 'must',
  },
  {
    id: 'rendering-arrives',
    site: 'freight-depot',
    stateId: 't2',
    subject: 'cl-fd-ines',
    situation: 'The unrendered claim from t1 now has a rendering. The original is unchanged.',
    requirement: 'Show the change as somebody\'s contribution, and keep the original reachable.',
    severity: 'must',
  },
  {
    id: 'coexisting-renderings',
    site: 'freight-depot',
    stateId: 't3',
    subject: 'cl-fd-ines',
    situation: 'Two English renderings, each credited, plus an objection to the first.',
    requirement: 'Neither is authoritative. The disagreement must be visible without speaking the original.',
    severity: 'must',
  },
  {
    id: 'reconciliation-candidate',
    site: 'freight-depot',
    stateId: 't3',
    subject: 'cl-fd-both',
    situation: 'A new claim suggests two competing readings were both true. The disputes still stand.',
    requirement: 'Do not present it as settled.',
    severity: 'should',
  },
  {
    id: 'passover-signals-are-not-ratings',
    site: 'freight-depot',
    stateId: 't3',
    situation: "Counts of sounds_right, dont_know and dont_care.",
    requirement: 'Routing signals, not scores. Never aggregate them, never show them as rejection.',
    severity: 'must',
  },
  {
    id: 'every-claim-traces-to-a-contributor',
    site: 'freight-depot',
    stateId: 't3',
    situation: 'Every claim has an author, a date and a source type. Every contributor is flagged invented.',
    requirement: 'Any view showing claim text can reach its source. The invented flag stays visible.',
    severity: 'must',
  },
  {
    id: 'one-record-many-claims',
    site: 'freight-depot',
    stateId: 't0',
    subject: 'rec-fd-01',
    situation: 'One written record with no files. Two claims came out of it.',
    requirement: 'Get from either claim to the record, and from the record to both claims.',
    severity: 'must',
  },
  {
    id: 'record-shows-who-brought-it',
    site: 'corner-shop',
    stateId: 't2',
    subject: 'rec-cs-directory',
    situation: 'A scanned directory page, brought by the person disputing the year, carried as evidence on their dispute.',
    requirement: 'Wherever the record appears, show the profile that brought it and where it is used.',
    severity: 'should',
  },
  {
    id: 'a-link-is-a-record',
    site: 'freight-depot',
    stateId: 't2',
    subject: 'rec-fd-07',
    situation: 'A web page handed over as a source, backing an extension. No files.',
    requirement: 'Show it as a source like any other record. Do not rank it by its address.',
    severity: 'must',
  },
  {
    id: 'collection-kept-whole',
    site: 'freight-depot',
    stateId: 't3',
    subject: 'col-fd-luis',
    situation: 'Two photos handed over together as one collection, with the contributor\'s note.',
    requirement: 'From either photo, reach the other and the note. A place shows records without taking them over.',
    severity: 'should',
  },
  {
    id: 'claim-cites-a-window',
    site: 'freight-depot',
    stateId: 't1',
    subject: 'cl-fd-ines',
    situation: 'A claim from 0:18 to 1:10 of a thirty-minute recording.',
    requirement: 'Take a reader to that stretch, not the start of the recording.',
    severity: 'should',
  },
  {
    id: 'transcript-is-not-a-translation',
    site: 'freight-depot',
    stateId: 't3',
    subject: 'rec-fd-04',
    situation: 'A transcript of one window in the original language, and two competing English renderings of the claim.',
    requirement: 'Show them as different things. One is what was said, the other is what it means.',
    severity: 'must',
  },
  {
    id: 'embedded-location-contradicts-the-place',
    site: 'freight-depot',
    stateId: 't1',
    subject: 'rec-fd-03',
    situation: "A photo's GPS lands 55m away in the street, accurate to 65m.",
    requirement: 'Do not move the pin. If both are shown, the difference must not look like a bug.',
    severity: 'must',
  },
  {
    id: 'media-still-processing-is-not-a-failure',
    site: 'freight-depot',
    stateId: 't3',
    subject: 'rec-fd-06',
    situation: 'A 604MB upload still being processed. The record is readable without it.',
    requirement: 'Show a job running, not a broken upload. Do not tell anyone to try again.',
    severity: 'must',
  },
  {
    id: 'open-flag-on-a-published-record',
    site: 'freight-depot',
    stateId: 't3',
    subject: 'rec-fd-04',
    situation: 'A published recording with a transcript and renderings on it carries an unresolved consent report.',
    requirement: 'Not a dispute, and not resolved. Do not imply it has been reviewed and cleared.',
    severity: 'must',
  },
  {
    id: 'standing-is-counts-not-a-score',
    site: 'freight-depot',
    stateId: 't3',
    situation: 'Every contributor has counts of what they have done. No score.',
    requirement: 'Do not add them up. Nobody\'s account of their own family gets a rating beside it.',
    severity: 'must',
  },
  {
    id: 'contributor-who-authors-nothing',
    site: 'freight-depot',
    stateId: 't3',
    subject: 'c-rob',
    situation: 'No records, no claims of their own, two well-reasoned disputes, a translation objection, two "sounds right" passovers, one report.',
    requirement: 'An empty authorship count is not an empty contribution.',
    severity: 'must',
  },
];
