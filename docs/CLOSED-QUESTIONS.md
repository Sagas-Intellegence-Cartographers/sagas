# Closed questions

These are decisions that came out of `DESIGN-QUESTIONS.md`, kept with their
reasoning so that somebody who runs into one next year knows it was considered
and does not reopen it from scratch.

A decision here may not be in the code yet. Each entry says what it is waiting
on, so if the contract still has the old shape, that is expected. If you think a
decision is wrong, say so and bring the reasoning. Building against one
without raising it causes trouble.

---

## `affirmation` duplicates a passover tier

Done in contract 2.3.0. The `affirmation` object is gone, and agreement is a
`sounds_right` passover. A profile's count of them is `soundsRightGiven`.

An affirmation and a passover were the same thing. An affirmation had an id, a
claim id, a contributor id and a timestamp. A passover has all of that plus a
`kind`, and one of the kinds is `sounds_right`. So an affirmation was a passover
with that kind set, stored in a table of its own.

The trouble was that only one of them counted. Affirmations reached the scorer
and passovers reached nothing, so whether a reader nodding at a claim counted
for anything depended on which button the interface happened to show them.

The fix was to drop `affirmation` and keep one reaction object with a kind on it.
`affirmationCount` in `ScoringInput` is now a count of the passovers where
the kind is `sounds_right`. All three kinds feed the same thing, which is how much a claim
gets surfaced rather than how true it is. Sounds right adds a little weight.
Don't care adds none, though it still records that somebody saw the claim, which
tells you something about reach. Don't know adds none either, and it says the
claim has not reached anybody able to judge it. None of the three create edges
and none of them are votes.

There should not be a fourth value for disagreeing. A cheap negative is a
downvote, and disputes carry reasoning on purpose. What is missing is a way to
say that somebody who knows should look at this, carrying no weight at all, and
`flag` may already be that mechanism sitting in the wrong place.

This was not a Part 1 change, the kind you can settle in a pull request on your
own, because deleting the object moved the fixture counts and therefore the
derived states.

## A dispute should be a claim

Done in contract 2.3.0. A dispute has its own claim, in the same conversation
as the claim it disputes, and the dispute edge points from that claim
(`fromClaimId`) to the detail it targets. The claim carries `disputedClaimId`.

Before 2.3.0 the two ways of responding to a claim were shaped differently.
`claim_disputed` produced an edge that carried reasoning and an optional
proposed value, and the reducer wrote it into `disputes`. An extension produced
a claim with a `parentClaimId`. So one of them created a node and the other did
not.

Part of a dispute already worked. `competingValues` lists each proposed value
with the distinct contributors who asserted it, so two people independently
saying 1914 both appear under 1914.

The reasoning was the part that did not work. Somebody citing a hotel register
and somebody citing what their aunt said both appeared under the same value, and
there was no way to back one and not the other. So the reasoning was an
assertion that could not be corroborated, extended or disputed. This archive
should be able to record an independent confirmation of a dispute's reasoning,
and with an edge alone it could not.

The fix was to make a dispute a claim carrying a dispute edge, with the
assertion in the claim and what it targets in the edge. `disputeCount` did not
change in value, because a dispute still produces one edge against its target,
so the ten scoring rules keep reading the same number. Later, it allows
a dispute with its own weight, which would be a new field in
`ScoringInput` rather than a changed one.

A dispute-claim has a source record like every other claim (the record its
conversation started from, `claim.sourceRecordId`), and it can carry evidence
records. So a dispute has provenance. Without it a dispute would be the only
assertion in the system with none, and it is the assertion type most likely to
be casual or hostile. The cost is that disputing means
typing what you know rather than clicking, which fits with disputes already
requiring reasoning.

Still open: whether `translationDispute` collapses into the same shape at the
same time. It is the same idea applied to a different target, and Part 1 of
`DESIGN-QUESTIONS.md` already logs it as a duplicate.

---

## Extensions target a detail

Decided on 27 September and done in contract 2.3.0 (`extensionEdge.targetDetailId`,
and each detail lists its extensions). An extension points at a detail of the claim
it adds to, the same way a dispute does, with a fallback to the whole claim for
an extension that is about all of it ("my family ran it until the war"). The new
information an extension brings lives in its own record, which is attached as
evidence.

The whole-claim fallback is an empty `targetDetailId`. Whether an extension
needs reasoning the way a dispute does is still open.

## `reference` is not an edge type

Decided on 27 September and done in contract 2.0.0. `edgeType` is dispute and
extension. The forms a claim takes are extension, dispute and resolution, and
`reference` was never one of them. `referenceEdge`, the `reference_marked`
event, and the fixture references are gone.

What a reference was trying to do, letting a claim point at another place, is
still a real need. How that works is open, under "What makes a place
significant?" in `DESIGN-QUESTIONS.md`.

## Lineage is dropped

Decided on 27 September and done in contract 2.0.0. `lineageId`,
`independentLineageCount`, `lineageDiversity` and `claimsCorroboratedByOtherLines`
are gone.

The rule stays: corroboration counts independent records. It never counts people. The idea that
a family is the unit of independence is gone. The system records
what people do rather than who they are, so it has no way to know who anybody's family is.
Nothing could ever fill the field outside the fixture data, so the fallback was
the only value it ever took. Family is also the wrong proxy. Two cousins
who heard one telling are one source, and two siblings who both saw the fire are
two.

In its place, a placeholder count stands in until the intelligence layer designs
the real one. `independentRecordCount` is the number of distinct records other
contributors have brought to back a claim. Agreement
never counts. How independence should really be worked out from the graph (the
same record cited twice, the same branch, descent from the same root claim) is
the intelligence layer's design work.

This also closes "Can vouching carry what lineage cannot?" and "Is family the
right unit?". Whether vouching says anything about independence is still open.

## "Element" is now "detail"

Decided on 27 September and done in contract 2.0.0. "Element" and "detail" were
two words for one idea, so "element" is gone. A detail is one piece of what a
claim asserts, and disputes and extensions both target one. `claimElement` is
`claimDetail`, `claim.elements` is `claim.details`, `elementStatuses` is
`detailStatuses`, and `targetElementId` is `targetDetailId`.

## A claim has a source record and evidence records

Decided on 27 September and done in contract 2.0.0. `claim.recordId` was doing
two jobs, being where a conversation starts and being evidence for one claim.
`sourceRecordId` is required and is the record the claim's conversation started
from. `evidenceRecordIds` is a list, often empty, of records attached to back the
claim up. An extension's new information lives in its own record, which is that
extension's evidence. Its source is still the conversation's source record.

Whether a conversation becomes a named object in the contract is still open,
and it may be dropped, because the source record already groups the claims read
from it.

## Agreement and corroboration are counted separately

Done in contract 2.0.0. `affirmationCount` in `ScoringInput` counts readers
agreeing, which since 2.3.0 means "sounds right" passovers.
`independentRecordCount` counts distinct records other contributors have brought
to back a claim, and agreement never counts toward it. The `corner-shop` fixture
has a claim with one independent record.

## A record's score is a citation count

Decided on 27 September, with no contract change: it's a scoring rule. A
record's only score is how many claims rely on it.
It never feeds back into claim weight, because a loop where a record's score
lifts the claims that cite it would reward itself.

