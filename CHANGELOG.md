# Changelog

Every change to `@sagas/contracts` or `@sagas/fixtures` gets an entry here with a
contract version, who it affects, what a consumer has to do, and most
importantly **why it changed and where it came from.**

**One changelog, not one per school.** A change frequently touches two layers,
and more to the point, seeing that the intelligence team found a flaw the
experience team is now working around is the entire reason the contract sits in
the middle. Splitting this file would hide the one thing it exists to show.

Entries name **layers**, not schools. Layers are stable; which university owns
one is not, and this file should still make sense to next year's cohort.

Changes land on Sundays, and the upstream watch in each fork reports them on Monday morning. See "When the contract changes" in
`docs/WORKING-TOGETHER.md`. Your fork is pinned, so nothing here reaches you until you pull.

**Two kinds of entry.** A contract change carries a version number. A repo change
(a new app, a new guide, tooling) carries a date only, because it does not move
the contract. Both say who they affect, and both are worth a Monday glance.

**Check this file every Monday.** If the **Affects** line doesn't name your
layer, you can stop reading and get on with your week.

## Entry format

```
## vX.Y.Z — YYYY-MM-DD

**Affects:** experience layer · intelligence layer · content layer · none (additive)

**What:** One line. The diff, in English.

**Why:** Where this came from. Which team hit it, or which conversation caused
it. This is the most useful field in the entry.

**You need to:**
- *experience layer* — nothing, or the specific migration.
- *intelligence layer* — nothing, or the specific migration.
```

---

## v2.4.0 — 2026-10-25

**Affects:** content layer · experience layer · intelligence layer

**What:** The contract catches up with decisions made over the last month.
- **Records** carry the contributor's choices (`choices`: the right to share,
  whether the student teams may see it, public now, later or never, what
  happens to a photo's location, whether it mentions people) and the terms
  version they were made under (`termsVersion`). A profile stores the terms
  version it accepted (`termsAcceptedVersion`). The provisional terms are in
  `docs/TERMS.md`.
- **A web page is a record** (`link`: url, title, when it was seen). It is
  evidence like any other record, weighed by independent people relying on it,
  never by its domain.
- **Collections** (`collection`, `collectionId` on records): records one
  profile hands over together stay together.
- **Time windows** (`timeWindow`): a claim can cite part of a recording
  (`sourceWindow`), and a transcript says which part it covers (`window`).
- **A recording is published on submission.** `awaiting_transcript` is gone
  from `submissionState`.
- **Scores take the scorer's shape.** `claimState.score` is a `claimScore`
  (a score and the named parts it's made of, for the claim and each detail),
  and each
  `detailStatus` has a `weight`. The fixtures fill them with an invented
  stand-in, `packages/fixtures/src/stand-in-score.ts`, which replaces
  `weight.ts`. `scoreTerm`, `detailScore` and `claimScore` now live in the
  contract, and `packages/fixtures/scoring` uses them.
- **The old count-based scoring rules are gone** (`packages/fixtures/behaviour`
  and the `rules` script). The rules a scorer answers to are in
  `packages/fixtures/scoring/rules.ts`, which gains two running rules: until the
  window a claim cites is transcribed, the part of its score that comes from the
  claim itself (its details and its relations to other claims) isn't counted;
  and a translated claim never scores lower than the same claim in English.
- **A new fixture, `freight-depot`,** replaces `example-site`. It carries the
  translation, rendering, transcript-by-window, link and collection cases, and
  stands for no real place or community. The corner shop's dispute now carries
  the directory page it cites as evidence.
- **Open questions** each have a placeholder test, and `docs/DESIGN-QUESTIONS.md`
  starts with a numbered index of every question and whose it is. Eight
  questions are new, numbered 30 to 37 in the index.

**Why:** These shapes are about to be built against: record intake, the place
page and the scorer. Some placeholder code also still showed an older approach
than the decisions it stood in for. Building on shapes that were about to change
would cost more than changing them now.

**You need to:**
- *content layer* — store `choices` and `termsVersion` on every record and
  refuse a record without them; `packages/fixtures/capture/rules.ts` checks
  both ("refuses a record without the contributor's choices, with a 400",
  "refuses a record without the terms version, with a 400", and "keeps a
  record's choices exactly as they were given"). Accept a record that
  is a `link` with no files. Store and return `collectionId` when a record has
  one. The scaffold has `apps/capture-api/migrations/010_record_choices.sql`
  (run `pnpm --filter @sagas/capture-api migrate`) and an updated worked
  `POST /records` to compare against. A recording is `published` on submission,
  since `awaiting_transcript` is gone. Transcripts carry an optional `window`.
  Your contributing screen shows the terms in `docs/TERMS.md` once per profile,
  and again whenever the current version differs from the profile's
  `termsAcceptedVersion`. Friday 30 October stays as agreed (`POST` and `GET` on main); the new
  fields are the target for the week after, by Friday 6 November, so the
  choices and terms guidelines will fail until then.
- *experience layer* — order claims by `weight` as before; read
  `claimState.score` and each `detailStatus.weight` if you show which details a
  claim leans on (never as numbers to a reader). Records can be a `link` (no
  files), carry `choices`, and belong to a collection (`graphState.collections`).
  Claims may have a `sourceWindow`. `awaiting_transcript` no longer exists.
  Every fixture record is public; a record whose `choices.public` isn't `yes`
  isn't shown to readers. If your code or tests name `example-site` or one of
  its ids (such as `cl-boarding`), point them at `freight-depot` (for example
  `cl-fd-office`); the acceptance cases moved with it. Your open-question
  placeholders are in
  `packages/fixtures/acceptance/open-questions.test.ts`.
- *intelligence layer* — import the score shapes from `@sagas/contracts` if you
  were using them from `packages/fixtures/scoring`. `detailScore` and
  `claimScore` keep their names; `term` is `scoreTerm` in the contract
  (`packages/fixtures/scoring` still exports `term` too). The
  graph's records can be `link`, records can list `transcribedWindows`, and
  claims can have `sourceWindow` and `translated`. When you remove the `.skip` in
  `apps/graph-api/src/scorer.test.ts`, every rule runs, including two new ones;
  the target for Wednesday is still the eight thin-frame tests in the guide.
  `packages/fixtures/behaviour` is
  gone; if anything of yours imported it, switch to `packages/fixtures/scoring`.

---

## 2026-10-22 — new design questions: links, collections, relevance and disputes

**Affects:** intelligence layer · content layer · experience layer (nothing to do)

**What:** `docs/DESIGN-QUESTIONS.md` has two new questions, each with a
placeholder test. "How does a link become evidence?" says a link to a web page
is one kind of evidence, weighed by what's recorded about it and by
independent people relying on it, never by its domain. Its shape and whether
the page gets captured are open. The placeholder is in
`packages/fixtures/scoring/rules.ts`. "What does a collection carry?" says the
records one profile hands over together stay together, attributed to the
profile and never to a named person. What else a collection carries is open.
The placeholder is in `packages/fixtures/capture/rules.ts`. Neither is in the
contract yet. Two more questions have placeholders in the scoring rules: "How
do you tell whether a reply is about what it targets?", which explains why
matching text doesn't work for relevance, and "Do all disagreements matter
equally?". "Can someone take their record back?" now says what's decided:
taking a record back means changing its privacy setting, and what happens to
claims built on it stays open. None of these is in the contract yet.

**Why:** An archivist told us provenance is what matters most when records
are gathered from many places, and the intelligence layer's design asked how
web sources should count.

**You need to:**
- *intelligence layer* — don't rank sources by domain. The link placeholder
  says what to build toward once links have a shape.
- *content layer* — nothing yet. Collections will reach the contract in a
  later release.
- *experience layer* — nothing.

---

## 2026-10-19 — a first task in the intelligence layer's guide

**Affects:** intelligence layer · experience and content layers (nothing to do)

**What:** `docs/PHASE-2-INTELLIGENCE-LAYER.md` has a step 0 before the list of
subproblems. Each person builds the corner shop as a scoring graph with the
builder in `packages/fixtures/scoring`, deciding for each step what the record
is, who handed it over, and what each claim points at. The first milestone
now names the eight tests a thin frame has to pass.

**Why:** The scoring graph shows a record only as an id, a kind, a contributor
and a time, so working in it alone never shows what a record is or how claims
attach to one. The corner shop shows both.

**You need to:**
- *intelligence layer* — nothing required. Step 0 is optional, for anyone
  who wants a quick way into the model.
- *experience layer, content layer* — nothing.

---

## v2.3.0 — 2026-10-19

**Affects:** experience layer · intelligence layer · content layer (nothing to do)

**What:** Four corrections so the contract matches the decided model.
- A dispute is a claim. Each dispute has its own claim, in the same
  conversation as the claim it disputes. `disputeEdge.fromClaimId` points from
  that claim, and the claim carries `disputedClaimId`. The reasoning and the
  proposed value stay on the edge.
- Extensions target a detail. `extensionEdge.targetDetailId` names the detail
  an extension adds to, or is empty when it's about the whole claim. Each
  `detailStatus` now lists `extensions` beside `disputes`.
- `topics` is gone from claims.
- `affirmation` is gone. Agreement is a `sounds_right` passover, so
  `claimState.affirmations` is gone too (use `claimState.passover.sounds_right`)
  and `contributorStanding.affirmationsGiven` is now `soundsRightGiven`.

The fixtures are rebuilt: every dispute in them now has a claim, and the
corner shop's "Mr. Ferris was my uncle" extension targets the owner detail.
Two numbers move as a result. Weights shift slightly where a claim already had
"sounds right" passovers, since those now count as agreement. And a profile's
`lastContributionAt` now counts every passover it left, of any kind.
Dispute claims are counted in `disputesRaised`, never in `claimsAuthored`.

**Why:** All four were decided between 27 September and 16 October and never
reached the contract, so anyone designing a schema now would have built the
old shapes.

**You need to:**
- *experience layer* — for your schema: a dispute is a row in claims (with
  `disputedClaimId` set) plus a dispute edge pointing from it
  (`fromClaimId`), and the edge is the real record of what it targets;
  `targetDetailId` on extensions is a nullable column; there is no
  affirmations table, agreement is a `sounds_right` passover; the profile
  field is now `soundsRightGiven`; claims have no `topics`. In the app: dispute
  claims are now in `state.claims`, so leave out the ones with
  `disputedClaimId` from top-level lists (`apps/web/src/app/page.tsx` and
  `features/article/ArticleView.tsx` do this upstream) and show them under the
  detail they dispute; replace `affirmations` with `passover.sounds_right`;
  each `detailStatus` now has `extensions` as well as `disputes`.
- *intelligence layer* — nothing in `apps/graph-api` changes; the scoring
  graph in `packages/fixtures/scoring` already had these shapes.
- *content layer* — nothing.

---

## 2026-10-18 — a phase 2 guide and API guidelines for the content layer

**Affects:** content layer · experience and intelligence layers (nothing to do)

**What:** `docs/PHASE-2-CONTENT-LAYER.md` is new: running the layer,
migrations, adding an endpoint, the record as it stands after 2.2.0, uploads,
and what's expected this phase. `packages/fixtures/capture/rules.ts` holds
guidelines for the content layer's API, written as tests that run against the
API over HTTP: records in and out, a 404, and the 400s, plus placeholders for
uploads, storage and media with hints about the libraries this project
expects. `apps/capture-api/src/capture.test.ts` runs them when
`CAPTURE_API_URL` is set. The worked `POST /records` now validates with
`newSourceRecord`, makes the id on the server, and sends back a record in the
contract's shape rather than the raw database row. The start guide and the
app README no longer give claim writing to this layer.

**Why:** The content layer is moving from text records to photos and
recordings, and the guidance was spread across the README, the start guide
and several emails.

**You need to:**
- *content layer* — pull, read the guide, and run the guidelines against your
  API.
- *experience layer, intelligence layer* — nothing.

---

## v2.2.0 — 2026-10-18

**Affects:** content layer · experience layer and intelligence layer (nothing to do yet)

**What:** One record is one artifact. `media` stays a list, for the parts of
one artifact such as the pages of a scanned letter, and every file in it must
be the same kind. A photograph and a recording describing it are two records.
The comment on `sourceRecord` that called a record a bundle is rewritten.
`newSourceRecord` is new: a record as it arrives, without an `id`, so whoever
stores it can generate the id.

**Why:** The content layer's schema already modelled one record per artifact,
which turned out to be the model; the contract still described a bundle. And
the contract required the client to send an id while a database that
generates ids refuses one from outside, so every version of a record upload
hit one of the two.

**You need to:**
- *content layer* — validate incoming records with `newSourceRecord` rather
  than `sourceRecord`, and let your database generate the id. Records with
  files of different kinds now fail validation.
- *experience layer, intelligence layer* — nothing. No fixture changed.

---

## 2026-10-15 — scoring rules on the graph, and a server for the intelligence layer

**Affects:** intelligence layer · content and experience layers (nothing to do)

**What:** `packages/fixtures/scoring` is new. The scorer now reads the graph
for one place (records, claims with their details, the edges people drew
between claims, passovers, profiles) and returns a score for every claim and
every detail, with the terms each score is made of. `rules.ts` holds the rules
a scorer answers to, written mostly as comparisons between graphs rather than fixed
scores, with open questions as placeholders that carry their context. A focus
summary at the end of each run shows which areas of the rules are thin.
`apps/graph-api` gets a scorer stub, a rewritten test file, and a working `POST /score`
endpoint with an example graph. `docs/PHASE-2-INTELLIGENCE-LAYER.md` is new: the
guide for the build phase, with the model in one place. The count-based rules in
`packages/fixtures/behaviour` are being retired; several no longer match the
model.

**Why:** A list of counts can't say which detail a dispute landed on, whether
two claims came from the same record, or who brought what, and those are most
of what scoring is about. The old rules also called agreement "support" in
places. The graph shape uses two decisions not yet in the contract: a dispute
is a claim, and an extension targets a detail.

**You need to:**
- *intelligence layer* — pull, read `docs/PHASE-2-INTELLIGENCE-LAYER.md`, then
  start in `apps/graph-api/src/scorer.ts`. Delete the `.skip` in
  `src/scorer.test.ts` once `similarity` exists.
- *content layer, experience layer* — nothing.

---

## 2026-10-11 — how the experience layer works, and where it deploys

**Affects:** experience layer · all layers (one line in the Git guide)

**What:** `apps/web/STATEMENT-OF-WORK.md` gains the working rules under "How we
work": teammate review on every pull request, squash for features and a merge
commit for upstream syncs, what goes upstream, the team changelog, demos, a
Thursday update, where to pick up work, and building against the contract when
the docs disagree. `apps/web/CHANGELOG.md` is new and holds this layer's own
changelog. The web README's deploy section records the approved landing page
setup on Cloudflare Workers and the domain, and backlog story P2 is marked
done. `docs/GIT.md` says to merge an upstream sync pull request with a merge
commit.

**Why:** These rules only existed in email until now.

**You need to:**
- *experience layer* — read "How we work" and start the changelog.
- *content layer, intelligence layer* — if you sync from upstream through a pull
  request on GitHub, merge it with a merge commit.

---

## v2.1.0 — 2026-10-04

**Affects:** experience layer · intelligence layer

**What:** A site's page gets sections. `section` is new: an id, the site and a
heading. `composition` is new too: a section's passage, made of its text plus
spans. A span is a stretch of the text that leads to the claims behind it, and
can also name the details it is about. Every `graphState` now carries
`sections` and `compositions`. The corner shop has invented ones in its states
t1 to t3, with one composition for each section. Every other site has none yet.

**Why:** The experience layer cannot build a readable page without knowing what
a section and its passage look like. How they are produced is open design work
that will take time, so the shape goes into the contract now,
with invented values in the fixtures, the same way `weight.ts` stands in for
scoring. What a heading is derived from, and how finely a passage points into
the claims, are open: see "What groups claims together at a site?" in
`docs/DESIGN-QUESTIONS.md`. Producing sections and passages is the intelligence
layer's work. Showing and exploring them is the experience layer's. The shape is
decided. If something has to change for it to work, bring it to a check-in.

**You need to:**
- *experience layer* — nothing breaks. Render `sections` and `compositions`
  when you are ready. A site with no sections has no passage yet, and shows
  its records on their own.
- *intelligence layer* — nothing breaks. This is the shape your grouping and
  passage-writing work is expected to produce. Bring what does not fit to a
  check-in.
- *content layer* — nothing.
- *anyone who builds a graph state by hand* — add `sections: []` and
  `compositions: []`.

---

## 2026-10-02 — experience layer statement of work

**Affects:** experience layer

**What:** `apps/web/STATEMENT-OF-WORK.md` sets out the whole reading product as
this layer's work, in five workstreams, with what the team decides alone and
what needs the sponsor. `apps/web/BACKLOG.md` gains "Sprint one", which replaces
epic A as the first sprint, and a template for new stories.
`apps/web/DEFINITIONS.md` defines the parts of the layer. `apps/web/PAGE-MODEL.md`
and `apps/web/page-model.html` are a wireframe of the corner shop's site page.
The guide and the web README now point at these, and their deploy sections
match the statement of work.

**Why:** The first plan gave this layer a slice of the product, and the team is
ready for all of it.

**You need to:**
- *experience layer* — read the statement of work, then sprint one. Anything
  started under epic A carries over, as the table under sprint one shows.

---

## v2.0.0 — 2026-09-28

**Affects:** intelligence layer · experience layer · content layer

**What:** Four changes to the shared model, in one release so there is one
migration rather than four.

- "Element" is now "detail". `claimElement` is `claimDetail`, `claim.elements`
  is `claim.details`, `elementStatuses` is `detailStatuses`, and
  `targetElementId` is `targetDetailId`.
- `claim.recordId` is split in two. `sourceRecordId` (required) is the record
  the claim's conversation started from. `evidenceRecordIds` (a list, often
  empty) holds records attached to back the claim up. On `claimState`, `record`
  is now `sourceRecord`, with `evidenceRecords` beside it. In the fixtures, an
  extension's own record is now its evidence, and its source is the
  conversation's source.
- `reference` is removed: from `edgeType`, `referenceEdge`, the
  `reference_marked` event, `claimState.references`, the three fixture
  references, and the acceptance case about them.
- Lineage is removed: `lineageId`, `independentLineageCount`,
  `integrityScore.lineageDiversity` and
  `contributorStanding.claimsCorroboratedByOtherLines`. In their place,
  `claimState.independentRecordCount` counts the distinct records other
  contributors have brought to back a claim, and `claimsCorroborated` counts a
  contributor's claims that have at least one. Agreement never counts as a
  source. Competing readings of a detail are listed in the order they arrived,
  not by headcount.
- The flagship fixture is now `corner-shop`, an invented site that follows
  `docs/HOW-THE-LAYERS-FIT.md`. The Basque site (`example-site`) stays as one of
  six. Every acceptance case now names its `site`, `loadAllStates()` returns
  every state of every site, and `/dev` has a site picker.

**Why:** "Element" and "detail" were two words for one idea. A claim's record
was doing two jobs: being where a conversation starts, and being evidence for
one claim. `reference` was never a form a claim takes. And nothing could ever
fill in a contributor's family outside the fixture data, because the system
records what people do, not who they are, so the family count was always its
own fallback. `docs/CLOSED-QUESTIONS.md` has the reasoning for each.

**You need to:**
- *intelligence layer* — `ScoringInput.independentLineageCount` is now
  `independentRecordCount`. Rename it in your scorer. The stand-in counts
  records and cannot see two records that share one telling. Working that out
  is yours.
- *experience layer* — rename `elements` and `elementStatuses` in anything you
  render, read the source record from `sourceRecord`, and stop describing
  support in families. `ConfidenceIndicator` and `DetailDisputes` show the new
  wording.
- *content layer* — a claim you create needs `sourceRecordId`, and can carry
  `evidenceRecordIds`. An extension that brings a new record attaches it as
  evidence.
- *all layers* — if you read `ACCEPTANCE_CRITERIA`, load each case's state with
  `loadSiteState(c.site, c.stateId)` rather than `loadState(c.stateId)`.

---

## 2026-09-28 — experience layer guide, backlog and direction

**Affects:** experience layer, and all three for the new walkthrough

**What:**

- `docs/START-EXPERIENCE-LAYER.md` is rewritten. It opens with what changed
  since the first version.
- New: `apps/web/BACKLOG.md` (the experience layer's epics and first stories)
  and `apps/web/DIRECTION.md` (what is decided and open about the narrative
  page, the suggestion interface, and references).
- New: `docs/HOW-THE-LAYERS-FIT.md`, one photograph followed through all three
  layers.
- All three start guides now explain turning on the upstream watch in a fork,
  and why one repository holds three teams.

**Why:** the experience layer had concepts where it needed concrete work, and
the first guide was written before several of the decisions above.

## 2026-09-15 — independence has no source outside the fixtures

**Affects:** intelligence layer · experience layer

**What:** No code changed. Two documents now say something that was true all
along and was not written down.

- `docs/DESIGN-QUESTIONS.md` gains "`independentLineageCount` defaults to the
  answer it exists to prevent."
- `docs/START-INTELLIGENCE-LAYER.md` carries it as a third gap for the entity
  relationship diagram.

**Why:** `lineageId` is hand-authored and nothing derives it, which was already
known and is why six scoring rules were removed. What nobody had followed
through is what `reduce.ts` does when the field is absent. It falls back to
`solo:<contributorId>`, so a contributor with no lineage becomes their own
family line. An archive where nobody has one does not lose the count. It gets a
count in which everybody is independent of everybody, which is the failure
`model.ts` says the field exists to prevent. The default resolves in the
permissive direction, silently, and the experience layer renders the result as
"Backed by 3 other families."

This surfaced while writing the experience layer's start guide, from the
`supportSummary` helper that renders the number to a person.

**You need to:**

- *intelligence layer* — read the third gap in your start guide before the
  diagram. The model has two values where it needs three: same line, different
  line, and no way to say unknown. That is a missing state rather than a bug and
  it is a good thing for the diagram to propose.
- *experience layer* — nothing to change. Build against the mechanic. Know that
  a sentence asserting independence is currently unjustifiable about real
  people.
- *content layer* — nothing.

**Not fixed here:** the comment above the fallback in
`packages/fixtures/src/reduce.ts` calls it "the guard against three cousins
reading as three independent records." It is the guard's off switch. That
correction lands with the next contract pass.

---

## 2026-09-15 — repo change, no contract movement

**Affects:** experience layer

**What:**

- New guide, `docs/START-EXPERIENCE-LAYER.md`. What to read, what to ignore,
  what to install, and the first task. It completes the set of three.
- `SETUP.md` now points each team at its start guide rather than at an app
  README. The app READMEs were never the right first read and the guides were
  not linked from anywhere somebody would look.

**Why:** The experience layer was the only one without a start guide, because it
was the last team to be assigned. The scope document that went to the department
predates several decisions and contradicts the repository in seven places,
including a synthesis API that does not exist this semester, a trust score the
model deliberately does not have, and two cross-team dependencies that were
never real. A guide built from the current model is the correction.

**You need to:**

- *experience layer* — read `docs/START-EXPERIENCE-LAYER.md` before anything
  else. Where it disagrees with the scope document you were given, it wins.
- *intelligence layer* — nothing.
- *content layer* — nothing.

---

## 2026-09-14 — an image record needs a note

**Affects:** content layer

**What:** a second refine on `sourceRecord`. If any of a record's media is an
image, `note` must be present and non-empty.

**Why:** a recording and a video carry their own account of what they are, and a
written record is text by definition. A photograph does not and cannot.
Submitted with nothing attached it is an artifact rather than a contribution,
and nobody downstream can read a claim out of it. `note` is the field for what
somebody says about the thing they are handing over, so that is where the
requirement lands rather than on `text`, which is the record itself when the
record is writing.

**You need to:**
- *content layer* — the submission form must require a caption when somebody
  attaches a photograph. It is one validation rule and it is worth showing the
  person why rather than only refusing.
- *intelligence layer* — nothing.
- *experience layer* — nothing. No fixture record changed; the one image in the
  fixture already carried a note.


## 2026-09-14 — a profile says whether anyone can prove it is theirs

**Affects:** intelligence layer · experience layer · content layer (additive)

**What:**

- `contributor` gains a required field, `verification`, which is `guest` or
  `verified`. Every profile in the fixtures is `guest`, and `verified` is not
  built this semester.
- `ContributorRegistered` gains an optional `verification`. Omitting it means
  `guest`, so the authored event log did not change.
- Every derived state now carries the field on each contributor. Ninety-two
  additions, no other value moved.

**Why:** guest ids are a way in rather than an end state, and the model had no
word for the difference. Without one, there is no way on the day verification
arrives to say that a verified person is a particular guest, and every
contribution made this year would be stranded. Adding the field later would mean
deciding retrospectively what all of it counted for. Adding it now costs one
enum.

Read the comment on the field before using it. It is a distinctness check, not a
credential. It asks whether this is one person once, which is the same question
`independentLineageCount` asks about families. It must never come to mean that a
verified person's claims are worth more because of who they are.

**Not included, on purpose:** any way to link two profiles. Merging a guest and a
verified profile that turn out to be the same person retroactively invalidates
corroboration the archive has already counted. That is written up in
`docs/DESIGN-QUESTIONS.md` under "A profile has no way to say whether anyone can
prove it is theirs", and nobody should build linking until it has an answer.

**You need to:**
- *intelligence layer* — nothing required. The field is available if you want it
  and it is not in `ScoringInput`. Read "Why the author is missing from
  `ScoringInput`" in your start guide before you reach for it.
- *experience layer* — nothing. Do not render it. A badge saying verified next
  to somebody's account of their own family is the thing this project avoids.
- *content layer* — nothing. Guest ids work exactly as before.


## 2026-09-14 — one word for each thing

**Affects:** experience layer · intelligence layer · content layer

**What:**

- "Account" is not a term in this project any more. If you find it standing for
  either a contribution or a login, that is a leftover. A **record** is what
  somebody hands over. A **claim** is somebody's reading of a record. A
  **profile** is who a contributor is to the software, which this semester is a
  guest id kept in browser storage. A definition block covering those three,
  plus **site** and **rendering**, now opens the root README and both start
  guides.
- The event kind `account_submitted` is now `claim_submitted`, and the interface
  `AccountSubmitted` is now `ClaimSubmitted`. That event carries a `claimId` and
  the reducer writes it into `claims`, so the old name described the wrong thing
  and did not match its siblings `claim_extended` and `claim_disputed`. No field
  on the event changed.
- The acceptance case `account-outside-the-graph` is now
  `claim-outside-the-graph`.
- Two state labels changed in `packages/fixtures/states`, because labels are
  authored in the event log and the fold copies them through. "Single account,
  no corroboration" is now "Single claim, no corroboration", and "Family
  corroboration and an untranslated account" is now "Family corroboration and
  an untranslated claim". Nothing else in any state moved. No claim, record,
  score, edge, or weight changed.

**Why:** `docs/START-CONTENT-LAYER.md` used "account" for a contribution on one
line and for a login twenty lines later. It said "there are no user accounts and
you should not build any" a few paragraphs before asking "what accounts are
within two kilometres of this building". Anybody reading it carefully would come
away with two meanings for the same word, and no way to tell which was intended.
The word was also a leftover from an earlier framing of this project as an oral
history archive, and it sits badly on a photograph or a deed.

**You need to:**
- *experience layer* — nothing, unless you render a state's `label`. Two of
  them changed wording and no data moved.
- *intelligence layer* — nothing. The scoring rules and their inputs are
  unchanged.
- *content layer* — nothing in code. If you have drafted stories or a plan that
  uses the word "account", check which of those words each one meant.


## 2026-09-08 — scoring rules and the intelligence layer's guide

**Affects:** intelligence layer

**What:**

- New guide, `docs/START-INTELLIGENCE-LAYER.md`. What to read, what to ignore,
  what to install, and the first task.
- `apps/graph-api` now runs tests. There is a `src/scorer.test.ts` with an empty
  scorer and the rules running against it, so `pnpm test` produces failures you
  can work against rather than a configuration problem.
- The scoring rules went from sixteen to ten. Six that asserted on
  `independentLineageCount` were removed, because a family is not something this
  system can currently observe. `lineageId` is hand-authored, nothing derives it,
  and there are no profiles to attach it to. The question moved into the "what
  these rules do not cover" block, which is where open problems belong.
- The remaining ten are prefixed `required` or `open to argument`. Required
  means this project will not merge a scorer that fails one. Open to argument
  means it is a position the sponsor holds and wrote down so it is checkable, and
  disagreeing is a check-in conversation.

**Why:** The suite was over-specified. It constrained the shape of the input as
well as the behaviour of the output, which meant a team designing independence
differently would have been fighting the tests rather than the problem. The
algorithm is the intelligence layer's deliverable and the rules should be a floor
rather than a design.

**You need to:**

- *intelligence layer* — read `docs/START-INTELLIGENCE-LAYER.md`. If you had
  already started against the sixteen rules, six of them are gone and the reason
  is in the file.
- *content layer* — nothing.
- *experience layer* — nothing.

---

## 2026-09-08 — repo change, no contract movement

**Affects:** every layer, but only if you have already run `pnpm db:up`

**What:** Each layer now has its own database, its own container and its own
`docker-compose.yml`, sitting next to the app that owns it.

| Layer | Where | Port | Database |
|---|---|---|---|
| Content | `apps/capture-api` | 5433 | `sagas_content` |
| Intelligence | `apps/graph-api` | 5434 | `sagas_intelligence` |
| Experience | `apps/ui-api` | 5435 | `sagas_read` |

The commands are unchanged, but they run from your app's directory rather than
the repository root. Object storage moved into the content layer's compose file,
so the other two layers never start it. The root `docker-compose.yml` is gone.

**Why:** The documentation already said each layer has its own database and the
scaffold only ever made one, so nothing enforced it. Sharing also meant object
storage sat behind a compose profile purely because one team needed it and two
did not, and both start guides spent a paragraph telling people which parts were
not theirs. One team's setup will grow over the semester and two will not, which
is the case where sharing costs the most.

**You need to:** If you have not started a database yet, nothing. If you have,
`cd` into your app, run `pnpm db:reset`, then `pnpm db:up`, and update
`DATABASE_URL` in your `.env` to the line for your layer.

---

## 2026-09-07 — repo change, no contract movement

**Affects:** content layer

**What:** `apps/capture-api` is set up so that nothing stands between you and
writing an endpoint.

- Express 5 and `pg` added, with `dev`, `start` and `migrate` scripts.
- `src/db.ts` holds a shared connection pool.
- `scripts/migrate.ts` applies numbered SQL files from `migrations/` in order,
  once each, inside a transaction, recording what it applied. Small enough to
  read.
- `src/index.ts` is a placeholder describing the shape of the first endpoint.
- The README covers the three decisions now made: Express 5, `pg` with SQL
  written out, and numbered migration files.

The endpoint itself and the first migration are not here. Those are yours.

**Why:** Choosing between server frameworks is a week of research that produces
a decision nobody on a first project is equipped to make, and configuration is
not the interesting part. The parts that are interesting stay yours.

**You need to:**

- *content layer* — `pnpm install`. Then read `src/index.ts`, which describes
  what to build.
- *intelligence layer* — nothing.
- *experience layer* — nothing.

---

## 2026-09-04 — repo change, no contract movement

**Affects:** content layer · everyone, lightly

**What:**

- New app, `apps/capture-web`, the contributing interface. It ships empty with a
  README, and the framework choice belongs to the content team.
- New guide, `docs/START-CONTENT-LAYER.md`, covering what to read, what to
  ignore, what to install, the first task, and how the months are shaped.
- `apps/capture-api/README.md` gains a "This semester" section: ordering, table
  ownership, no authentication, no hosting, how translation works.
- Editor config committed. `.vscode/extensions.json` recommends the extensions
  this repo expects; `.vscode/settings.json` turns on format-on-save and points
  TypeScript at the workspace version.
- `docs/DESIGN-QUESTIONS.md`. Part 3 is now "Open by design" and Part 4 is "Not
  for this project to answer". Four new entries on inherited trust, reference
  edges, the split between a person as record subject and as platform profile,
  and naming people who can't consent.
- Root README notes the licence and how contributions are credited.

**Why:** The content team started, and the repo had a domain description without
an ordering. Everything here is about making the first week smaller.

**You need to:**

- *content layer* — read `docs/START-CONTENT-LAYER.md`. It replaces guessing.
- *intelligence layer* — nothing yet. Your equivalent guide is coming.
- *experience layer* — nothing yet.

---

## v1.0.0 — unreleased

**Affects:** all layers. This is the starting point.

**What:** Initial contract, covering all three layers.

Claim graph: sites, contributors, claims with typed addressable elements,
dispute / extension / reference edges, affirmations, passover signals,
translations.

Content capture: records, media references with processing state and
derivatives, transcripts, captured location with the method that produced it,
and flags. A record is a bundle rather than a file type, and every claim points
at the record it was read out of.

Intelligence input: every derived state carries what each contributor has
actually done, as counts and never as a score, and every claim carries the
record it was read out of.

Anduiza fixture: 64 authored contribution events, four derived states, nine
records. Twenty acceptance criteria covering granular disputes, corroboration
independence, untranslated claims, coexisting renderings, one record producing
several claims, media still processing, an embedded location that contradicts
the place, an open flag on a published record, and a contributor who has
authored nothing and is one of the most useful people in the record.

No period field on a claim. What somebody said about time is kept in their
words, on date elements, and `datedClaims` in the integrity score counts how
much of a record is anchored in time from those rather than from a bucket
chosen at entry.

**Why:** Written by the sponsor in August 2026, before any team existed and
before anyone from the Basque community had reviewed it. Expect it to be wrong
in at least one interesting way. `packages/fixtures/README.md` carries a list of
known gaps, and closing one is a welcome PR.

**You need to:** Nothing. This is the first one.
