# @sagas/fixtures

Development fixture data for the Sagas claim graph. The sponsor owns it, and it
is **versioned** rather than frozen: it will change during the semester, because
changes here are how design pressure reaches every layer.

Your fork is pinned to a tag. A fixture change lands in your fork when we agree
at a check-in to pull forward, never in the middle of your sprint. Every change
carries a contract version bump and a CHANGELOG line saying what a consumer has
to do about it. If one arrives without that, it's a mistake on our side. Say so.

## The content here is invented

Every contributor, family, and remembered event in this package is fictional.
It was written to exercise the data model. It records nothing real, and no site
stands for a real community. The comment at the top of each site's `events.ts`
says which places, if any, use a real street or coordinates.

Do not display this data publicly, cite it, or show it to community members as
though it were testimony. It is scaffolding for your development environment.

## What this is, structurally

There is one authored file per site: an append-only log of contribution events
in timestamp order. Graph states are derived by folding that log up to an
instant. **States are never authored by hand.**

```
fixtures/<site>/events.ts    ← the only authored file for each site
src/reduce.ts                ← fold(events, upTo) → GraphState
states/<site>.t*.json        ← generated, do not edit
```

The log is in timestamp order and event ids are sequential, so `ev-041` really
did happen after `ev-040`. If you add an event in the middle, renumber.

This shape exists because the version-history timeline needs it. A state built
by folding knows exactly which contributions produced it, so
`eventIdsSincePrevious` on each state is a real answer to "what changed and
who changed it" rather than a second fiction that has to be kept consistent
with the first by hand.

```bash
pnpm build:states   # regenerate states/ and print a readable dump
pnpm test           # invariants over the derived states
```

If you need a graph state that doesn't exist yet, add a cut to `stateCuts`.
Don't write a state file by hand.

## The four states of `freight-depot`

Every site has states t0 to t3. The table and notes below are for
`freight-depot`, the longest log. `corner-shop` is the flagship and the one to
read first: it is the worked example in `docs/HOW-THE-LAYERS-FIT.md`, and
`fixtures/corner-shop/events.ts` says at the top what each of its states shows.

| | integrity | claims | records | contributors | disputes | untranslated |
|---|---|---|---|---|---|---|
| **t0** sparse, single source | 19 | 3 | 2 | 1 | 0 | 0 |
| **t1** a photo, an unrendered recording, a dispute | 48 | 6 | 4 | 3 | 1 | 1 |
| **t2** a rendering arrives; a window is transcribed | 61 | 7 | 5 | 5 | 1 | 0 |
| **t3** competing renderings, reconciliation candidate | 89 | 10 | 8 | 6 | 4 | 0 |

Counts come from the generated states. If you change the log, regenerate and
update this table, because a stale table here is worse than no table.

Each state deliberately exercises something:

- **t0** — everything single-source and low weight. One written record with no
  files produces two claims. A sparse site must look sparse on the map. It must
  never look empty.
- **t1** — a photograph arrives whose embedded GPS puts the camera across the
  street. Its contributor disputes *one detail* of the office claim, the year,
  and the person in it is left alone. A thirty-minute recording in French is
  published on submission, and a claim from 0:18 to 1:10 of it arrives with no
  rendering yet: kept and readable, with the part of its score that depends on
  what it says waiting.
- **t2** — a rendering of the French claim arrives, and somebody transcribes
  just the window it cites. The original is untouched. A web page arrives as a
  record of its own and backs an extension of the office claim.
- **t3** — a second rendering coexists with the first, each attributed, with a
  preserved objection about what the first one loses. A new claim suggests both
  years for the office were true (a reconciliation candidate), and the dispute
  still stands. A second photo joins the first in one collection. A 604MB video
  is still processing when the log ends, and an open report sits on the
  recording saying a second voice on it never agreed. One contributor writes no
  claims except disputes and still does a lot: an objection to a rendering, a
  report, and two "sounds right".

Records run underneath all of it. Eight of them, deliberately unalike: written
records with no files, two photographs handed over as one collection, a
recording transcribed a window at a time, a web page, and one upload still in
the queue. Every claim points at its source record, the record its
conversation started from, and some claims also carry evidence records.

## What your interface has to handle

The fixture data exists to put these situations in front of you.

They are **direction rather than a specification of your work.** They say what must not
happen. How your interface satisfies them is your design, and most of what you
build will be things this list says nothing about.

`acceptance/cases.ts` holds a one-line version of each so the `/dev` page can
show the relevant ones next to your components. The reasoning is here.

### A thin record is not a broken one

This project expects most places, most of the time, to have three claims from
one person and nothing corroborated. That scores about 23 out of 100 and it is a real place with a thin
record.

An interface that renders it in red, or as an empty state, or as an error, tells
the person who just contributed that their family's claim failed. It did not.
It is early. This project treats this as the hardest judgment in the layer,
because it is the common case and the easy design gets it wrong.

### Agreement is not corroboration

Someone reading a claim and agreeing carries almost no evidence. Two people
independently bringing a record about the same building is real corroboration
and it counts for far more.

The model counts independent records. It never counts heads. Agreeing is not bringing a
source, so a count of agreement on its own must never be presented as support.
Five people saying "sounds right" is one source with five reactions to it.

### Disagreement lands on one detail

Somebody disputes the date. The address, the person and the event on the same
claim are untouched and still corroborated.

Marking the whole claim as contested throws away the thing that makes this
useful, and it does something worse: it makes a person's account of their family
look discredited when one detail is in question.

### Nothing gets adjudicated

When two readings compete, show both with their support. Neither is marked the
winner, neither is hidden behind an interaction, and they are never shown as a
vote tally. Lead with each
reading's reasoning. Leading with how many people gave it turns evidence into a
poll.

### A claim nobody has translated yet is not worth less

It is kept, readable in the original, and attributed. It carries no weight only
because there is nothing yet to compare it against. It is never hidden and never
sorted off the end of the page as though weight zero meant worthless.

When a rendering does arrive, that is somebody's contribution and should read as
one. Several renderings can coexist, none authoritative, and a reader who does
not speak the original still has to be able to see that two people disagree
about what it means.

### A record is a bundle, and a transcript is not a translation

What arrives is whatever the person had: a recording, a photograph with a
sentence under it, a page they typed, or several at once. One icon and one label
will misdescribe it.

A transcript says what a recording says. A rendering says what it means in
another language. Collapsing them loses the fact that somebody who speaks the
language has already verified the words, and that the remaining argument is
about meaning.

### Work in progress is not failure

A large upload still being processed is a job running. It is not a broken
upload. The
record stays readable while it finishes, and nobody is told to try again.

### Reports and signals are not ratings

`sounds_right`, `dont_know` and `dont_care` are routing signals. They decide what
gets shown to whom. They are not quality scores, they must never be aggregated
into one, and a pile of `dont_know` must never read to a contributor as their
claim being rejected.

A report on a record is not a dispute and says nothing about whether the claim
is accurate. The model has no way to resolve one, so nothing may imply a record
has been reviewed and cleared.

### Contribution is not authorship

Somebody with no records and no claims, who has raised two well-reasoned
disputes and one report, is one of the more useful people in the archive. Any
view that ranks or lists contributors has to survive that.

Contributor standing is counts and only counts. Adding them up invents a score
the model deliberately does not have, and a score gets displayed, and then
somebody's account of their own family has a rating beside it.

### Everything traces to a person

Attribution is never optional and never anonymous. Any view that shows claim
text must be able to reach its source.

While the data is invented, every contributor carries a flag saying so, and that
flag must survive into anything anyone can see. A screenshot of development data
must not read as real testimony.

## What no fixture covers yet

Each of these is a real situation the record can be in. Until a fixture
exercises one, every team is free to get it wrong until integration, so closing
any of them is a useful pull request.

- A place with only untranslated claims, so nothing is in the graph at all
- A claim contested by a dozen people
- A claim with no details that is not awaiting translation
- A claim long enough to break a reading layout
- A place with exactly one claim and no contributors beyond its author
- Two places close enough together to collide as map markers
- A claim whose only "sounds right" passovers come from people who joined the same day
- Two transcripts of the same recording that disagree about what was said
- The same file uploaded by two people, so the checksums collide and it is one
  source rather than two
- A record whose processing failed outright rather than still running
- A record nobody has read any claims out of yet
- A report that has been upheld, and whatever is supposed to happen next
- Somebody vouched for by a person everyone trusts, who has contributed nothing.
  There is no vouching in the model, so this cannot be represented at all
- Two contributors with identical standing counts whose contributions are
  obviously not equivalent

## Seeing what a change does

There are two tools for this, and neither needs a browser.

### Seeing every changed claim with git diff

The states are calculated from the log, so changing anything upstream and
regenerating shows you the consequence in full:

```bash
pnpm fixtures:build
git diff packages/fixtures/states/
```

Change the scoring and every claim that moved appears in that diff, so you can
see which claim now leads the article, how the integrity score shifted, and
whether the claim nobody has translated just got buried.

That works as a regression test and a picture at the same time. This project
relies on it for questions like "does this quietly discount small communities",
which a unit test cannot show because it only knows the number it was told to
expect.

The automated checks confirm the committed states match what the log produces,
so a change you forgot to regenerate fails the build rather than drifting.

### Asking why one claim scores what it does

```bash
pnpm inspect                                     # every claim at t3, one line each
pnpm inspect cl-cs-shop                          # one claim on the flagship, with its terms
pnpm inspect --state t1 cl-cs-shop               # the same claim earlier
pnpm inspect --site freight-depot cl-fd-office   # a claim on another site
```

It prints each claim's score as the named parts it's made of, and each detail's
score, in the shape the intelligence layer's scorer returns. The fixtures'
scores come from an invented stand-in (`src/stand-in-score.ts`), so the numbers
mean nothing. The parts show what a real score is made of.

## Boundaries

**There is no synthesis endpoint this semester.** These fixtures are what you
build against. The intelligence layer builds the synthesis engine in the spring. If you are
writing code that fetches narrative state over the network, stop and ask.

**`src/stand-in-score.ts` is not the scoring algorithm.** It's an invented
stand-in, in the shape the real scorer returns, so claims and details have an
order to render. Designing the real one is the intelligence layer's work, and
the stand-in gets replaced when it exists.

The properties in it worth preserving are constraints on the problem rather
than solutions to it. Edges are the strong signals: an extension pushes a claim
up and a dispute pushes it down. Passovers, agreement included, are soft signals
that matter most for what gets suggested. And agreement never counts as an
independent record.

**The sections and passages are invented by hand.**
`fixtures/corner-shop/narrative.ts` holds sections and passages (`compositions`)
written for the fixture, with helpers in `src/narrative.ts`, so the page can be
built before anything produces real ones. They are merged into each state's
`sections` and `compositions` after the event log is folded.
`test/narrative.test.ts` checks that every span points at claims and details
that exist in that state. Only the corner shop has them so far.

**Emphasis is by weight ordering.** The highest-weight claim at a node is the
primary reading; competing claims stay visible inline. There is no "community
accepted" status and no endorsement threshold. Dissent is preserved, not
adjudicated.

**There are no actual files behind the media.** The storage keys in the fixture
point at objects that do not exist, because committing a hundred megabytes of
invented audio to a git repository helps nobody. Everything else about a record
is real: sizes, durations, content types, processing states, derivatives. Putting
bytes behind those keys is content-layer work and a good early one.

## Open questions about the fixtures

If you have an opinion on any of these, bring it to a check-in.

- Whether coexisting attributed renderings is the right model for translation
  at all, or whether it encodes an engineer's assumption about how translation
  works.
- Whether a dispute should keep targeting a typed detail (`targetDetailId`) or
  a character span of the claim text. Typed details were chosen because they are
  authorable by hand and give a renderer what it needs without offset math.
  Spans remain reachable.
- Parallel language trees with links across them, which this project leaves as
  a research question for a future cohort. The schema is built not to
  foreclose it: `language` on
  claims and `sourceLanguageText` as a first-class field. How a claim in one
  language tree would point at one in another is open.
