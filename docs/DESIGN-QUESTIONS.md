# Design questions

Things in this codebase that are wrong, or at least unsettled, with no decision
made about them yet. Every item is a real question with arguments on both sides,
written down so you can see the shape of the problem before you run into it.

Read the section that touches what you are working on before you refactor
anything. Some of these look like sloppiness and are not, and others look
deliberate and are not. Most of them are here because I could not work out the
answer, so disagreeing is the expected response rather than a problem. If you
find a question this file missed, add it, because the next team reads this file
too.

Decisions that came out of this file move to
[`CLOSED-QUESTIONS.md`](./CLOSED-QUESTIONS.md). A question can be resolved there
and still not be built, so read it before you build against a shape that is
going to change.

Parts 1 to 3 are sorted by how much conversation an answer needs. Part 4 holds
questions that are not for this project to answer at all, and says why.

### Index of questions, with the team each belongs to

The number is the question's place in this file, so it can change when a
question is added or closed. Cite a question by its title, which doesn't. Each open question in parts 1
to 3 has a placeholder test, in the rules of the team it belongs to, that names
it: `packages/fixtures/scoring/rules.ts` for the intelligence layer,
`packages/fixtures/capture/rules.ts` for the content layer, and
`packages/fixtures/acceptance/open-questions.test.ts` for the experience layer
and the shared contract.

| # | Question | Whose |
|---|---|---|
| 1 | The edge types are copy-pasted | Shared contract |
| 2 | Every id is just `string` | Shared contract |
| 3 | `translationDispute` and `disputeEdge` are the same idea | Shared contract |
| 4 | A transcript and a translation are the same kind of thing | Shared contract |
| 5 | What does an interface do with "sometime in the fifties, probably"? | Experience |
| 6 | Does disputing a claim feel like disputing the person who wrote it? | Experience |
| 7 | Should one claim hold more than one assertion? | Intelligence |
| 8 | How does a record get a location? | Content |
| 9 | A profile has no way to say whether anyone can prove it is theirs | Content |
| 10 | How should a resolution be recorded? | Intelligence |
| 11 | How does a link become evidence? | Intelligence, content |
| 12 | What does a collection carry? | Content |
| 13 | How do you tell a good source from a bad one? | Intelligence |
| 14 | Can someone take their record back? | Content |
| 15 | How to tell silence from doubt | Intelligence |
| 16 | How do claims compare across languages? | Intelligence |
| 17 | How to record disagreement about meaning | Intelligence |
| 18 | How to tell a productive argument from a stuck one | Intelligence |
| 19 | Moderation without majority capture | Intelligence |
| 20 | What groups claims together at a site? | Intelligence |
| 21 | Should a contributor see why their claim ranks where it does? | Experience |
| 22 | Can standing be inherited through vouching? | Intelligence |
| 23 | Does a late dispute count for less? | Intelligence |
| 24 | Is the unit of work a task? | Intelligence |
| 25 | What makes a place significant? | Experience |
| 26 | A person named in a claim versus a person with a profile | Intelligence |
| 27 | What happens when one detail turns out to be two people? | Intelligence |
| 28 | Can a claim be edited? | Intelligence |
| 29 | How do you tell whether a reply is about what it targets? | Intelligence |
| 30 | Can a passover point at one detail? | Intelligence |
| 31 | What happens to a supporting record that stops holding up? | Content |
| 32 | How are machine-made drafts treated? | Content |
| 33 | Is every ask in the system one kind of object? | Experience |
| 34 | Is there a state between visible and hidden? | Intelligence |
| 35 | Where does a record's weight as evidence live? | Intelligence |
| 36 | Can someone dispute that two records are independent? | Intelligence |
| 37 | How does someone reach a contributor without knowing who they are? | Content |
| 38 | Do all disagreements matter equally? | Intelligence |
| 39 | Who decides what a place is called? | Not for this project |
| 40 | Naming people who can't answer | Not for this project |
| 41 | Is this built for the community, or for people outside it? | Not for this project |
| 42 | Should all of it be public? | Not for this project |
| 43 | What should a disagreement look like to the people in it? | Not for this project |

---

# Part 1 — Answerable with a pull request

These are local changes and you don't need permission for them. Open a pull
request with your reasoning and bring it to a check-in.

## The edge types are copy-pasted

**Now:** `disputeEdge` and `extensionEdge` in
`packages/contracts/src/model.ts` each declare their own `id`,
`contributorId`, and `createdAt`. So does `passover`.

**Why:** so the whole model reads top to bottom without following an
inheritance chain, and because it was written to the requirements rather than
to the pattern behind them.

**The problem:** three places to change when the shared part changes, and nothing
stops them drifting. It also hides something true, which is that every one of
these is a person doing something to something at a time.

**Why this is hard:** a shared base type removes the duplication and makes the
file harder to read straight through. Zod's `.extend()` handles this cleanly, but
inferred types get harder to follow in editor tooltips, which matters when
you're learning the model.

## Every id is just `string`

**Now:** `SiteId`, `ClaimId`, `ContributorId` and the rest are all aliases for
`string`.

**The problem:** nothing stops you passing a claim id where a contributor id
belongs. TypeScript will let it through and you'll find out at runtime, or
worse, never.

**Why this is hard:** branded types fix it (`type ClaimId = string & { __brand:
'ClaimId' }`) at the cost of needing a cast every time you construct one from a
plain string, which is often. Zod supports `.brand()`. Whether the friction is
worth the safety depends on how much id-juggling the code ends up doing, which
nobody knows yet.

## `translationDispute` and `disputeEdge` are the same idea

**Now:** two separate shapes. One objects to a claim, the other objects to a
translation. Both carry a contributor, a target, reasoning, and a timestamp.

**The problem:** they will keep diverging. A third kind of objection is already
foreseeable (see Part 2), and it'll be a third copy.

**Why this is hard:** merging them means a target that can point at different
kinds of thing, which is either a discriminated union or a polymorphic
reference. Both are more complex than what is there now. The question is whether
that complexity is worth paying for today or once there are three.

## A transcript and a translation are the same kind of thing

**Now:** `transcript` and `translation` are separate shapes. One turns audio into
text, the other turns text in one language into text in another. Both are one
person's interpretation of a record, both are attributed, both allow more than
one to exist, and neither has a slot for the correct one.

**Why:** they were added at different times, for different layers.

**The problem:** a third will show up. Text pulled out of a scanned letter is the
same shape again, and `mediaDerivative` already has a `text_extract` kind that
half-does it.

**Why this is hard:** merging them needs a single shape with a source, a target
language, a method, and a person, which is more abstract than either of the two
and reads worse for the common case. The transcript that starts as machine
output and gets corrected by a person is the hardest case I can see, so try
that one first.

---

# Part 2 — Bring it to a check-in first

These change the shape of the model, which means they affect more than one team.
Raise them before building.

Two questions from this part have since been decided, and their reasoning moved
to [`CLOSED-QUESTIONS.md`](./CLOSED-QUESTIONS.md).

## What does an interface do with "sometime in the fifties, probably"?

**Now:** what somebody said about time is kept in their words, as the `excerpt`
on a date detail. `1963-1964` sits next to "this would be 1963, 1964".
`before boarding house` sits next to "Before the boarding house". Nothing
normalises those into a year, and there is no period field on a claim.

**Why:** a period field (a bucket like `depression_war_1930_1945`) was removed
because it was a coarser copy of what the excerpt already held, and nothing
read it.

**The problem:** you cannot sort or filter on a phrase. "During the war" and
"1943" belong near each other on a timeline and no code can currently tell.

**Why this is hard:** normalising into a range makes filtering work and implies
precision nobody has. Showing the raw phrase is honest and unsortable. Doing
both may be clutter, and doing neither means the archive has no way to answer "what
do we know about the fifties".

Whatever you build here has to keep the words. A range calculated from a phrase
is a reading of it, and readings in this project are attributed and contestable
rather than silently replacing the thing they read.

## Does disputing a claim feel like disputing the person who wrote it?

**Now:** a `claim` holds both a person's telling and the assertion inside it.
`cl-cs-uncle` in the corner shop fixture is both Mae's story about her uncle
and the assertion that he ran the shop until the sixties. A dispute attaches to
a detail of that claim.

**The problem:** disputing the claim visibly disputes the person. Somebody's
story about their own family is personal, and telling one takes a bit of
courage. I think a system where the public picks it apart feels wrong however
carefully the interface is worded.

**What the model already does:** a record is separate from the claims read out
of it. A photograph or a recording is a record, and there is nothing in it to
dispute. A claim can be written by somebody other than the person who handed
over the record, so a photograph with a one-sentence note is a complete
contribution and somebody else can read claims out of it later.

**What is still open:** when the person who gave the record also writes the
claim, disputing a detail of it still reads as disputing them. Whether the
interface or the model should do anything about that is open. So is whether a
family accepts a stranger writing the claims about their record.

## Should one claim hold more than one assertion?

**Now:** a claim is a paragraph with typed `details` inside it. Disagreement
points at a detail id.

**An alternative:** "my grandfather ran sheep through Bruneau Canyon in 1943"
becomes three claims: a person, a place, a date. Each one is a single
assertion.

**What that buys:** a date claim compares directly against a date claim from
another source, with no digging into a paragraph. Disputes point at a claim and
the detail-id indirection disappears. The two edge types become one shape.

**What it costs:** more work at entry time. And `1943` on its own means nothing,
so something has to group atomic claims back into a readable statement.

## How does a record get a location?

A record ends up with a location, and the record says how it got one. That part
is settled.

**Now:** `capturedLocation` holds coordinates, a `method` of `placed`,
`geocoded`, `embedded`, or `inherited`, and an optional `accuracyMetres`.
Separately, `site.coordinatePrecision` is `approximate` or `surveyed`.

**The problem:** `coordinatePrecision` collapses two different things. A photo's
embedded GPS is precise to a few metres and frequently wrong, because the camera
was across the street from the building. A pin dropped by the granddaughter of
the woman who worked there is imprecise and authoritative. Method and precision
are separate axes and that enum has one.

**The routes, with what each costs:**

- *A pin on a map.* No external dependency, no credentials, and the person
  placing it usually knows the building. It works badly on a phone and for
  somebody who doesn't recognise the street layout from above, and it can't
  place a building that isn't there any more.
- *Geocoding an address.* An address is familiar to type and can be copied from
  a letterhead. It needs an external service with credentials, it gets vague
  outside a city grid, and it returns a point on a street rather than a building.
- *Reading it out of the file.* Free, already in most phone photos, and the only
  route that needs nobody to do anything. It is also the most confidently wrong, and it
  raises a privacy question: somebody uploading a family photo has not necessarily
  agreed to publish where they were standing.
- *Inheriting the place's coordinates.* This is always available and never adds
  anything.

**The open part:** should precision be stored or
worked out? A stored number is somebody's guess written down once. A derived one
could take the method, the source, and how much else agrees, and produce
something better than any single guess.

But a derived figure that drives where a pin renders means changing the formula
silently moves every pin on the map, with no record of where they used to be.
That is the same problem `WEIGHT_MODEL_VERSION` exists to handle in the fixtures,
and it is not obvious that location deserves a lighter answer than weight did.

**Worth checking:** geocoding services may already report how precise a result
is. If an existing vocabulary fits, use it rather than inventing one.

## A profile has no way to say whether anyone can prove it is theirs

**Now:** `contributor` carries an id, a display name, an institution, a joined
date, the invented flag, and `verification`, which is `guest` or `verified`.
This semester every profile is a guest id kept in browser storage.

**The problem:** a guest id is only a way in. Somebody starts
contributing without signing up and verifies later. `verification` names the
difference, but nothing can connect a guest profile to a verified one when
verification arrives. On the day verified profiles exist, every contribution
made as a guest this year is orphaned unless it can be connected.

**The part that is built:** `verification` lets a scorer treat a distinct
verified person differently from an unrecoverable one, which is not reputation. It is the
same kind of signal as counting corroboration by independent record. It asks
whether this is one person once. Whether the person is any good is a separate
question.

**The expensive part:** linking. If guest G and
verified V turn out to be the same person, and V once brought a record to back
a claim by G, that record was never independent. Linking two profiles
retroactively invalidates corroboration the archive has already counted, and
claims that were shown as well supported because of it.

Do not build profile linking until there is an answer to what happens to
everything the archive already said on the strength of the old counts.

## How should a resolution be recorded?

**Now:** there are two edge types, dispute and extension. When a claim
settles an earlier disagreement it is filed as an extension, and nothing records
that it was written to settle anything. The fixture has one at t3 and the only
place it is called a reconciliation candidate is a comment.

**The problem:** the archive cannot tell somebody adding context apart from
somebody proposing that two conflicting readings were both true. Those are
different acts and a reader should be able to see which one happened.

**The cheap version:** an optional field on `extensionEdge` listing the disputes
it claims to resolve. The contract has two edge types, and "The edge types are copy-pasted" in Part 1
already asks whether they should share a base. Whether resolution becomes a
third type or a field on an extension is open.

A resolution, on this reading, is not a new kind of thing. It is a claim
attached by an extension edge that names what it settles, which is the same
node-and-edge shape everything else has.

**A system can propose here. It cannot decide.** Disputes already target
specific details, so the set of open conflicts at a node is computable without
reading anything. Showing somebody "these two readings disagree on the date and
on the owner, do you want to write something that covers both" is the same
pattern as proposing cross-language matches for a person to confirm.

**Two things I would not build.**

Requiring the people who raised the disputes to accept a resolution would hand
one person a veto over the record. In a community that already disagrees, a single
holdout freezes a node forever.

A consensus threshold that flips a resolution into an accepted state is the
endorsement mechanism this project removed. Passovers are not votes and the
contract says so. A resolution is a claim. It carries weight like any other
claim and it can be disputed like any other claim. Whether a resolution locks
anything is open.

## How does a link become evidence?

A link to a web page can be a source. It's one kind of evidence, like a
photo or a document. That part is decided, and contract 2.4.0 gives a record a
`link` for it.

How a link is weighed is decided too. Its strength comes from what's
recorded about it (its kind, its date, where it came from) and from how
people treat it over time: who relies on it, who disputes it, and whether
independent contributors reuse it. Those signals go through the same
independence rules as everything else, so fifteen links that nobody
independent relies on add little. A domain ending like .gov or .com is weak
metadata. It tells you who published a page and nothing about whether the
page supports the claim, so a tier list of domains isn't how links are
weighed.

**The open part:** whether the page's content gets captured when a link is
added. A captured copy would survive the page changing or disappearing, and it
would let the content of the page count toward a score. Until a page is
captured, one suggestion is to treat the link like a recording nobody has
transcribed yet: it counts for what's known about it and nothing for what it
says. Capturing would happen where records come in. What a site's terms of use
allow you to store is also unknown.

## What does a collection carry?

An archivist told us that pooling records by place loses who collected them
and why, and that provenance is what archives care about most. So records
handed over together stay together.

This part is decided, and it's in contract 2.4.0 (`collection`). A collection is the set of records one
profile hands over together, kept whole. A place page points at records and
never takes them over, so a record keeps its collection wherever it's shown.
A collection belongs to a profile, which can be a guest like `guest_25674`,
and never to a named person. It records what a profile did and says nothing
about who they are, the same line scoring draws.

**The open part:** what else a collection carries. Who originally made or
gathered the records, and why they were kept, are what an archivist wants.
Those are statements the contributor makes. They aren't links to a profile.
A grandmother's name is about a real person, so it would sit in the
contributor's own words and fall under their choices about mentioning
people. Whether those fields are required, optional, or something another
person can add later is also open, and so is whether a record can join a
collection after it arrives.

# Part 3 — Open by design

These are left open on purpose. They are not homework and they are not blocking
anything.

Open here means I do not have an answer. I have not looked into whether anyone
else does.

Two kinds are mixed together. Some I have no answer to at all. Others could be
settled in this repo and deliberately are not, because designing them is the
deliverable rather than a distraction from it. Either way the answer is yours to
argue for.

## How do you tell a good source from a bad one?

This is the intelligence layer's main deliverable, and I think it is the
biggest open question in the project. Several other questions in Part 3 depend
on it.

Some claims deserve more weight than others. Somebody who has contributed twenty
things that other people independently backed is not in the same position as
somebody who arrived yesterday. Saying so is reasonable. Every method of saying
so that I have thought of has a failure mode worse than the problem it solves.

**What you have to work with.** `contributorStanding` in the contract records
what each person has done. Records submitted, claims written, claims that
somebody else backed with a record of their own, claims somebody disputed, disputes raised, how many of
those disputes proposed an alternative instead of only objecting, "sounds right" passovers given,
translations, transcripts, flags, and when they were first and last active.
These are counts. There is no score, and that is deliberate.

That list is the constraint on your answer. An algorithm can only use what the
model wrote down. If you want a signal that is not there, that is a contract
change and a useful one. Ask for it early.

**The rule is this.** How somebody is regarded should not outweigh the
record of what that person has actually contributed. The two come apart, and
the shortcut to watch for is one that uses how somebody is regarded in place of
what they did.

**Why the obvious answer does not work.** If a claim's weight depends on its
author's standing, then people who have been contributing longer carry more
weight on every claim they make, whatever the claim says. The archive would
start agreeing with whoever showed up first.

The same problem appears in moderation, under "Moderation without majority
capture" below.

**Things worth trying.** Corroboration by independent records is the one signal
that enthusiasm alone cannot produce, and a stand-in for it is already counted
(`independentRecordCount`). Whether
a dispute produced a new record or only more disputes is structural and needs no
reading. A claim nobody has engaged with is not a doubted claim, so standing
built on engagement will undercount claims nobody has seen. And nothing in the
model lets one contributor vouch for another, so somebody the whole community
knows looks exactly like a stranger until they have posted enough.

**What to avoid.** Standing should not become a single number. As soon as it
does, it will be displayed, and then somebody's story about their own family has
a rating next to it.

## Can someone take their record back?

The model says nothing is deleted. Disagreement is preserved rather than
resolved away, which is most of the point.

But that's a principle about *disagreement*, and it collides with a principle
about *consent*. If a family contributes a record and decides years later they
don't want it public, what happens? What happens to the interpretations and
claims built on top of it?

Part of this is decided, and it's in contract 2.4.0 (`recordChoices`). Every record
carries its contributor's privacy choices, including whether it's public
(yes, ask me later, or no), and those choices can change later. So taking a
record back means changing its privacy setting, and the record isn't deleted.
Deletion is something a person asks for under the terms.

What's still open is what happens to everything built on a record once it
stops being public: the claims read from it, the extensions that cite it as
evidence, and the scores that leaned on it.

You can see the hole in the code. `submissionState` runs from `draft` to
`published` and has no exit, because adding one would have been answering this.
`flag` has a `not_mine_to_share` reason, which is somebody raising exactly this
problem, and nothing downstream knows what to do when that flag is upheld.

I don't have an answer to that part. It's the most likely thing to matter in
practice.

## How to tell silence from doubt

A claim nobody has engaged with tells you about attention. It tells you nothing about truth.

This matters here because the records most likely to sit untouched are probably
the ones not in English, from rural places and small communities, and from
people who aren't online. If the interface makes silence look like doubt, it
discounts the material the archive exists for.

The model already asks instead of treating a skip as silence. When somebody
moves past a claim, a passover records which of three things it was:
`sounds_right`, `dont_know` or `dont_care`. A claim covered in `dont_know` has
not reached anyone able to speak to it.

Whether asking is honest is the open part. Someone who skipped because they were
tired now has to pick one of your categories, and what comes back is partly an
artifact of having asked. A manufactured signal is worse than a missing one,
because it looks the same as a real one.

## How do claims compare across languages?

A claim in French and a claim in English can be about the same building
and the same year. Working out that they agree is easy for a person and hard for
a machine.

Part of it is easier than it looks: a date is `1943` in any language, and a place
is a pointer. Structured comparison gets you further than it seems before any
language model is involved.

The rest is open. Whatever handles it should propose matches for a person to
confirm rather than asserting them.

## How to record disagreement about meaning

The model assumes disagreement is about details: a date, a name, a place. You
dispute a detail, propose a value, and support accumulates on each reading.

Two people can agree on every detail of a claim and still disagree, because one
of them thinks what happened was a betrayal and the other thinks it was the only
option anybody had. No detail carries that, so there is nothing to target and
nothing to propose instead.

A mechanism for contesting meaning would be a mechanism for adjudicating
meaning, and this project does not adjudicate.

What the archive does with such a branch is open. There are three candidates and
none of them is chosen:

- Nothing. The claims sit side by side, both uncontested, and the reader works
  it out.
- The interface shows that two well-supported claims are about the same event,
  without saying anything about the relationship between them.
- The disagreement becomes its own claim, attributable like anything else, which
  makes it visible without making it resolvable.

An archive built entirely around detail-level dispute may read, to somebody
inside one of these branches, as having decided their disagreement does not
exist.

That is the engineering half. Whether an archive should represent this kind of
disagreement at all is a question for the community whose record it is, and Part
4 carries it under "What should a disagreement look like to the people in it?"

## How to tell a productive argument from a stuck one

Some disagreements are productive. People bring new material and the record gets
better. Others are two people restating themselves at each other, or a group
agreeing loudly and calling the noise corroboration.

You can tell these apart structurally, without reading anything. Do disputes
land on different parts of the claim or pile onto one? Does a dispute produce
new records, or only more disputes? How many distinct contributors are involved?
Does anyone reply?

What you'd *do* with that is the open part. Letting it change how much a claim
weighs is the tempting option and probably the dangerous one.

## Moderation without majority capture

Flags need prioritising or the queue is useless. The obvious approach weights
them by the standing of whoever flagged, so a report from a well-known person is
looked at first every time.

The obvious approach also lets an established majority bury a minority claim.
Communities have internal divisions, so that isn't hypothetical.

The idea is that standing should decide what a person looks at first and never
what disappears without a person looking at it. That has not been tested, and it
may be too weak to be useful.

## What groups claims together at a site?

Claims attach to a site, and each has a source record (`claim.sourceRecordId`),
the record its conversation started from. There is no conversation object, so
at the site level every claim sits in one pool. A
site accumulates unrelated topics: who cooked there, what the floor was made of,
who owned it in 1912. Nothing in the model separates them, and a reader arriving
at a busy site gets one long undifferentiated list.

One option is to make the conversation a named object, so claims live inside
conversations and the grouping is a stored thing with an author. That option has
been argued against and may be dropped: the source record already groups the
claims read from it, so a conversation would be a middle layer doing the same
job. It is not decided. Until it is, group claims by source record. The shape
would go from a site holding claims directly to a site holding conversations,
each of which holds claims. A site could then carry several unrelated
conversations without them interfering, and a claim that wandered off topic
would be a claim in the wrong conversation rather than noise under a site. It
may also be the answer to how a busy site divides itself when it renders as an
article, with the conversations becoming the sections.

One thing would need settling first: whether a record introduces exactly one
conversation, since a forty-minute recording covering three unrelated things
would introduce three. A conversation cannot exist without a record, because
every claim needs a source record, and typing what your grandmother told you is
itself a text record.

Another option is that grouping is computed rather than stored, so it is a
clustering problem over claim text and details and it changes as the archive
grows. Extensions are going to target a detail (decided and not yet built, see
`docs/CLOSED-QUESTIONS.md`), which will let claims that target the same detail
be grouped.

Working out which claims belong together is a graph question and belongs to the
intelligence layer. How a grouping is laid out on a page belongs to the
experience layer.

Since contract 2.1.0 the page has a shape to build against while this stays
open. A `section` has a heading. A `composition` is the section's passage: its
text, plus spans, which are stretches of the text that lead back to the claims
behind them. The fixtures carry invented ones. Three parts of that are still
open:

- **Where a heading comes from.** The sponsor's expectation is that it is
  derived rather than written by a contributor, and that it holds steady as
  claims arrive. What it is derived from, and what it attaches to while the
  contract has no conversation object, are open.
- **How finely a passage points into the claims.** A span always names the
  claims behind it, and can also name the details it is about (`detailIds`,
  optional). Whether a span should always reach a detail, never, or only
  sometimes is open, so some fixture spans carry `detailIds` and some do not.
- **How a passage is written,** and how it stays readable as claims arrive. The
  fixture passages show what a page can expect to receive.

## Should a contributor see why their claim ranks where it does?

No score is shown to anyone, but a contributor can see where their claim sits,
because the highest-weight claim at a node renders as the primary reading.
Whether they can see why is open.

I think showing the reasoning is the honest option, and it fits an archive built
on attribution. Somebody whose claim sits low deserves to know it is
because nobody has brought an independent record for it yet, rather than being left to
guess that the system disliked them.

The objection is that a visible rationale is a specification for gaming it. If
the interface says a claim needs an independent record, that is
also an instruction for how to manufacture one.

I don't know whether that objection holds for this archive. Bringing a second real record is harder than creating a second
profile. It may be that the gaming risk is small enough here to pay for the
honesty.

## Can standing be inherited through vouching?

A new contributor starts with no history, which is right, and it also means
nothing they write carries any standing. Nobody
builds standing without contributing, and not many people contribute into a
system that treats them as nobody.

One way out is vouching. An existing contributor vouches for a newcomer, who
inherits some fraction of their standing.

The objection is less about bots than it looks. I think a bounded metric could
handle fake profiles. It does nothing about a large real family whose real
members really do vouch for each other, which is the failure this project
actually cares about.

Staking makes it worse. Staking means a voucher's own standing rises or falls
with the person they vouched for. If vouching couples two people's standing, then in a community with existing divisions vouching becomes
a political act, and people decline to vouch across a line they already don't
cross. The trust graph reproduces the split it was meant to see past.

It also collides with a decision already made. The scorer reads what a profile
has done, never who it is. Inherited standing is a property of a person rather
than a record of what they did, so it cannot be used without breaking that. That may still be the right
trade. It hasn't been argued.

## Does a late dispute count for less?

The idea is that a dispute raised long after the claim it targets carries less
influence on its own than one raised close to it, and that corroboration can
overcome the damping. A weak signal backed by enough independent records still
ends up strong.

In this idea, a period ends when activity on a topic rises, holds, and falls
away. Engagement says when a period closed. It says nothing about what is good
inside one, and the damping would apply to everything in a period equally.

Check this before anything else: the model records one date where this needs
three: when the thing happened, when the person came to know it, and when they
said so. `record.capturedAt` is when the artifact was made, so a recording made
in 2026 of a story somebody was told in 1960 about 1922 carries one of the
three. Without the other two, any damping is measuring when somebody got around
to typing.

Open:

- How is distance measured? Period count and elapsed time come apart. A busy
  site might pass through six periods in a year while a quiet one sits in one
  for three, so damping by period penalises a dispute on the busy site six times
  harder for the same calendar gap. That might be right, on the grounds that
  activity means the record was being examined and somebody missed the window.
  It might also be an artifact.
- Does it apply to every edge or only to disputes? An extension arriving late is
  enriching the record rather than attacking it, and damping extensions equally
  makes the archive harder to improve as it ages.
- How does a chain inherit it? If claims descend from a damped dispute, do they
  weigh less or more? That is a question about what the archive is for before it
  is a question about arithmetic.
- Cold start. With few contributors, one person's burst of activity closes a
  period. That is fragile exactly when the archive is thinnest.

## Is the unit of work a task?

Transcribing is a task. Translating is a task. Writing a claim is a task.
Working out who to ask is a task. If task were an object, behavioural history
would be per category by construction instead of tracked separately for each
activity.

`contributorStanding` is already the accounting half of this. Every field in it
counts a completed act. What a task object would add is the part missing
everywhere else: an addressable piece of open work with a state, which is what
makes a queue a queue rather than a step inside a form. The translation queue,
the transcript queue and the moderation queue are the same want, three times,
under three names.

There is one constraint. Some acts close and some do not. `flag` has a status.
`disputeEdge` has none, on purpose. A dispute is a task that completes the
moment it is filed and never gets resolved, and a task model that cannot express
that will start asking interfaces to close disagreements. The shape of a dispute
is also changing (see "A dispute should be a claim" in `CLOSED-QUESTIONS.md`).

This is logged as a direction rather than a decision, and it is not for this
semester.

## What makes a place significant?

Some places matter more than others, and the archive should be able to say so
without anyone declaring it. One idea: a place referenced often in claims about
*other* places has earned significance from how the community talks rather than from
anyone's opinion.

Any count like that has to follow this project's rule, which is that
independence is counted by record rather than by headcount. How a claim points
at a different place at all is open, because the `reference` edge that used to
do it was removed (see `docs/CLOSED-QUESTIONS.md`).

## A person named in a claim versus a person with a profile

A person named in a claim is the same shape as a place named in one: a span
of text pointing at something that may not be in the archive yet. One marking
mechanism covers both, which is one feature instead of two.

A person is two entities though. Maria as the subject of a record is archival.
She is what the claim is about, and she may have died in 1961. Maria as a
contributor is a platform actor with behaviour and standing.

I expect most person references will never have a profile behind them. Most of
the people an oral history archive talks about are probably dead, so the subject is the normal
case and a living claimant is the exception. Designing it the other way round,
as profiles that can point at subjects, gets the common case backwards.

Whether being the subject earns weight is the obvious question, and the answer
is probably no. Being the person a story is about makes you one source among
many, sometimes a badly placed one. Families can be unreliable about their own.

A living claimant probably does not want more weight. She wants something taken down, softened, or corrected,
and she would use an identity claim to ask for it. That is the same problem as
"Can someone take their record back?", reached from another direction.

Treating "I am Maria" as a claim is a neat answer, because it corroborates and
disputes like any other claim and needs no new machinery. The consequence is
bad, because the people who can confirm it are her own family, who may all be
repeating one telling. Identity is the case where the independence rule is least
able to help and the case where being wrong costs the most.

## What happens when one detail turns out to be two people?

Somebody claims that a well-known man's son was a singer and died young, the
same way his father did. A reply disputes the death: the son died in a car
accident at nineteen. Then the first person explains that there were two sons.
The oldest died in the accident and the second was the singer. Nobody was wrong.
"His son" pointed at two people, and the disagreement was about who was meant.

The model has no way to say this. A dispute targets a detail and offers another
reading of it, which treats the two claims as competing values for one thing.
Here the right outcome is to split the detail into two people, each with their
own claims, both standing. A passage written from these claims would need to
change from "his son" to "his oldest son" and "his second son".

Open:

- Can a detail be split, and who can split it?
- Is a split a new kind of claim, or something the intelligence layer works out?
- What happens to support already given to the detail before the split?

## Can a claim be edited?

A correction can arrive two ways. Somebody can change their own claim, or they
can add a new claim that corrects it. The model does not say which is allowed.

Editing in place keeps the page tidy, but it changes what other people already
responded to. A dispute aimed at the old wording would then point at words
that no longer exist. A new claim keeps the history and costs a little
clutter. Either way, a correction from the same person is not independent
support for anything, because it comes from one telling.

Open:

- Can a claim's text change after it is submitted?
- If it can, what happens to the disputes, extensions and passovers aimed at
  the old version?

## How do you tell whether a reply is about what it targets?

A claim chooses what it targets, which keeps it attached to the right detail,
but the target doesn't limit what the claim says. Someone can target a record
and then write about their grandfather's farm. Weight already handles most of
that: weight flows through details, so a claim that touches none of its
target's details earns nothing, however long or charming it is.

Checking relevance by matching text doesn't work, because the most relevant
reply often shares no words with its target. "It opened in 1924" is the best
possible answer to a detail that says 1948, and it doesn't contain 1948. One
way to think about it is to split a detail into what it's about (the shop's
opening), what kind of thing it states (a date), and its value (1948).
Relevance is checked on the first two. The value then decides whether the
reply agrees, disagrees or adds something.

**Open:**
- How a claim's content gets marked up (a date, a place, a mention of a
  person, a site, a source or another claim), and which layer does it. If the
  pieces are marked, relevance becomes matching how two claims are marked,
  rather than matching their words.
- Relevance is checked one link at a time, a reply against the detail it
  targets. Whether support should weaken as it passes through more links in a
  chain is open.
- Where talk that isn't about any detail goes. One option is a conversation
  layer around a record that carries no weight. That's the same open question
  as whether a conversation becomes a named object.

## Can a passover point at one detail?

Somebody who agrees with the first half of a claim and not the second has no
way to say so: a "sounds right" covers the whole claim. Disputes and
extensions already point at details, so passovers are the odd one out.

One proposal is that a passover on the whole claim would cover every detail,
and a reader could mark one detail differently ("sounds right, except this"),
overriding the whole-claim mark for that detail. The controls would sit after
the claim, so people read all of it before reacting.

**Open:** whether to do it, and whether a detail-level passover feeds weight on
that detail or only routing.

## What happens to a supporting record that stops holding up?

A supporting record (evidence, a transcript, a translation) can stop holding
up: questions about it go unanswered, the work it depended on fails, or a
person reports it for breaking the terms.

One proposal is a lock: no new references to the record, while existing
references would stay visible and marked as locked, and claims that relied on
it would lose that support with the trail kept. The proposal keeps two tracks
separate. Quality could lock and unlock automatically. Breaking the terms would
go through moderation, with a person deciding, and support from the crowd
couldn't undo it. A locked record still exists
and stays visible, so "a record has no exit" still holds.

**Open:** whether to have a lock at all, what the threshold would be, and how
the two tracks are kept apart so moderation never becomes a vote.

## How are machine-made drafts treated?

The proposal is that a machine transcript or translation would be a draft with
a name on it: a supporting record like any other, credited to a system profile
that names the model and its version. An error would trace to a version, and a
bad version could be marked down everywhere it produced output. A machine would
propose, and a person would confirm.

**Open:** the shape of a system profile, and how marking down a version affects
the claims that relied on its output.

## Is every ask in the system one kind of object?

People will ask for things: a question, a source, a better source, a
transcription of one window, a translation, a check of a link. One proposal is
a single request object with a type and a direction: inward (asking
contributors to work on a claim or record) or outward (to someone who isn't part
of the conversation about that record). A claim citing a window with no transcript would open a transcription
request for that window automatically.

**Open:** the types, whether an open request should put the target's weight at
risk until it's answered, and whether repeated requests stop adding pressure
after a cap. It overlaps "Is the unit of work a task?".

## Is there a state between visible and hidden?

Some things need checking before they count: a burst of new profiles posting
near-identical details, say. One proposal is quarantine: the thing stays in the
system and stays visible, carries no weight, and is left out of passages while
it's checked. It's separate from moderation, which hides things that break the
terms.

**Open:** what puts something into quarantine and what takes it out, whether
quarantine and a locked record are one state or two, and how long checking can
take before it becomes a quiet way of burying something.

## Where does a record's weight as evidence live?

How much a record counts as evidence depends on what kind of record it is and
on the claim it's attached to: a dated photograph backing a year counts for
more than a typed paragraph backing the same year. This project has decided
that weight sits on the evidence edge (the connection between a claim and its
evidence), rather than on the record itself.

**Open:** whether that weight is stored on the edge or worked out each time,
and what the edge records beyond the two ends.

## Can someone dispute that two records are independent?

Independence counts records. Two records can look independent and not be: two
cousins' recordings of the same story told once, or the same photograph scanned
twice by two people. This project has decided that anyone can dispute that two
records are independent, with reasoning and evidence, like any other dispute.

**Open:** the shape of that dispute (today a dispute can only target a detail
of a claim), and what an upheld one does to the claims counting both records.

## How does someone reach a contributor without knowing who they are?

Profiles are anonymous first. The project measures what a profile does, never
who it is, so nobody is asked to identify themselves before sharing a story.
That keeps the barrier low for people who are hesitant to share.

It also means an archivist or a researcher who wants a record for their
collection has no way to find out who brought it. The sponsor's position is
that identity is handled off the platform: someone with a reason can ask to
reach a profile with a track record, the contributor decides whether to
answer, and anything about who they are is exchanged outside the project.

**Open:** how the request reaches the contributor, what stops it being used to
pester or identify people, and whether a contributor can turn requests off.

## Do all disagreements matter equally?

A disagreement over whether a shop opened in 1948 or 1952 matters to a
business historian and to almost nobody else. A disagreement over whether a
family was forced out of a neighbourhood matters to everyone. If every
dispute gets the same weight and the same space on a page, the small ones
crowd out the ones that matter.

How much a dispute matters looks like its own dimension, separate from how
well supported it is. It also fits a rule already in the tests: one dispute
shouldn't knock over a well-supported detail.

**Open:** what decides how much a dispute matters, whether it changes
scoring, display or only what gets suggested to whom, and who gets to say.

---

# Part 4 — Not for this project to answer

Everything above this line is a question an engineer can reason about. These are
not.

They are decisions about how a community wants its own record kept, and no
amount of care in this repository substitutes for asking. That hasn't happened.
The design so far was made without anybody from the communities whose records it
is meant to hold, and that is worth knowing while you read the rest of this file.

**So this section is a commitment rather than a backlog.** These do not get
settled by argument, here or anywhere in this repo. A pull request answering one
would be the exact presumption the section exists to name.

What you can usefully do is notice when your work runs into one, and say so.
"I built this and I think it assumes something nobody has checked" is a good
thing to bring to a check-in.

## Who decides what a place is called?

A site has a formal `name` and a list of `aka`. Something had to be primary and
the official name got it.

That is not neutral. The name on the deed and the name people use are often
different, and which one leads is a small statement about whose record this is.

## Naming people who can't answer

Marking a place in someone's claim is low stakes. Marking a person is not.

Most people named in an oral history are dead. They did not consent, cannot
correct the record, and their descendants may not agree with each other about
what should be said. A person reference makes all of that permanent, searchable,
and joined across every claim that mentions them.

Whether the archive should do it at all is a question for the families in it,
not for whoever is writing the schema.

## Is this built for the community, or for people outside it?

The current design renders claims in English, with the original preserved
underneath. That
ordering assumes a reader who does not speak the original.

The reverse is a coherent design and it was never considered. Neither was
whether a community would want its record legible to outsiders at all.

## Should all of it be public?

Nothing is deleted and everything is visible. That is stated as a principle
throughout this repository, and it is a design position rather than a neutral
default.

My understanding is that for some communities certain knowledge is not meant to
be openly held, and may be restricted by role, by season, by initiation, or by
kin. An archive with no way to express that is not neutral toward those
communities. It is wrong for them.

None of the thinking on this has been reinvented here. The CARE Principles for
Indigenous Data Governance and the Local Contexts project are where I would
start reading, and if your work touches access, read them first.

## What should a disagreement look like to the people in it?

Preserving dissent instead of resolving it is the founding decision of this
project. It is also the one most likely to feel different from the inside.

Two families seeing their disagreement rendered permanently, publicly, with both
names attached, is a specific experience. Nobody has asked whether it is a
welcome one.

# Adding to this file

Same shape as Parts 1 to 3:

- **Now** — what the code does today
- **Why** — if there was a reason, even a bad one
- **The problem** — what goes wrong
- **Why this is hard** — what stops the obvious fix from working

Leave out the answer. If you know the answer, it isn't a design question. It's a
pull request.
