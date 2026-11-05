# Where the experience layer is heading

Three parts of this layer matter most and none of them is fully designed. For
each one, this page says what is already decided, what the first steps are, and
what is still open. The open parts are meant to be worked out with you, at
specification meetings, as the first steps land.

Decided means you can build on it. Open means nobody has an answer yet, and a
proposal from you is useful input even when it turns out to be wrong.

---

## The narrative page

The page a person reads about a place. It is the center of this layer.

### What is decided

- **Each site has a page.** Everything people have said about a place is
  reachable from its page. The page is one way into the graph. There are
  others.
- **Claims are ordered by weight.** The intelligence layer gives each claim a
  weight. Among claims that compete, the highest-weight one renders as the main
  reading, and the others stay visible beside it. The weight itself is never
  shown.
- **Nothing is marked as settled.** There is no "accepted" version, no stamp,
  and no count of how many people agree. Disagreement stays on the page.
- **Disagreement sits on a detail.** When somebody disputes the year in a claim,
  the year shows two readings and the rest of the claim reads normally.
- **A thin page is not a broken one.** One contributor and nothing corroborated
  is the normal state of a new place, and it has to read as early. It must never read
  as failing.
- **Every claim can be traced** to the person who made it and the records it
  rests on.

### First steps

These are backlog items C1 to C4. Render one source record and the claims read
from it, then disputes on a detail, then where each claim comes from, then
translations. The sections in contract 2.1.0 then arrange these into a page.

### What is open

- **How a page is divided up.** A busy place might have dozens of claims. A
  reader needs them grouped into something like sections. Contract 2.1.0
  gives each site sections, with invented ones in the fixtures for now. Whether
  a section should follow one source record and its claims, or group by theme
  across records, is not known. Working out which claims belong together is a graph question
  for the intelligence layer. How a grouping is laid out on a page is yours.
  `docs/DESIGN-QUESTIONS.md`, "What groups claims together at a site?", has the
  rest.
- **Whether "conversation" is a named object in the shared contract.** It has
  been argued against and may be dropped. Do not build on it. Group claims by
  source record.
- **How the claim graph becomes prose.** Claims extend and dispute each other,
  so they form a tree. Since contract 2.1.0, each section has a passage with
  phrases that lead back to the claims behind them. How a passage is written
  belongs to the intelligence layer. How a reader moves between the passage and
  the tree behind it is a design question for this layer.
- **What "sometime in the fifties, probably" looks like on the page.** See the
  design question with that title.

---

## The suggestion interface

How a reader is pointed at what to read next, and how somebody who knows
something is pointed at where they could add it.

### What is decided

- **Routing decides what gets suggested, and it's never shown as a number.** This layer
  works out what a person should be pointed at, as backlog work, and the interface shows the
  suggestion.
- **Passover is how a reader leaves a light signal.** `sounds_right`,
  `dont_know` and `dont_care` on a claim. None of them is a vote. They change
  how far a claim travels. They say nothing about whether it is true.
- **There is no downvote.** Disagreeing means writing a dispute, with reasoning.
  That is deliberate.
- **Silence is not doubt.** A claim nobody has responded to has not reached
  anybody who knows. It must never look rejected.

### First steps

Backlog item D1, a design exercise. The routing behind suggestions sits with this layer
and doesn't exist yet, so the interface gets designed first against invented signals, and
the real ones slot in later.

### What is open

- **What the signals are.** Which places need attention, which records have no
  conversation yet, which claims are waiting for a translation. Your design helps decide which ones are worth
  having.
- **Question prompts.** A proposal is that whoever hands over a record can say
  what they want from it ("does anyone know the year?", "can someone translate
  this?"), and anybody can add prompts to a record with no conversation yet.
  Those prompts would be natural things to suggest. This is not in the contract
  yet.
- **Whether the unit of suggested work is a task.** See `docs/DESIGN-QUESTIONS.md`,
  "Is the unit of work a task?"

---

## References

How the page shows what each claim rests on (its source record, its evidence
records and its renderings), and how somebody outside the site links to one
claim. This is about display. `reference` used to be an edge type in the graph
and was removed. Nothing here brings it back.

### What is decided

- **Every claim has a source record**, the one its conversation started from.
  It may also have evidence records attached.
- **Renderings are credited.** A transcript or translation shows who made it,
  and several can sit side by side.
- **A record's citation count is how many claims rely on it.** That is the
  only score a record has, and the intelligence layer does not rank records
  beyond it.

### First steps

Backlog item C3: show where each claim comes from. Then a stable link to a
single claim, so somebody can cite one claim rather than a whole page.

### What is open

- **Whether "relied on by 12 claims" is shown to readers.** It is a count rather
  than a judgment, but it could still read like a rating. Bring a view on this.
- **How a citation is formatted** for somebody citing a claim in their own
  writing.
- **Rating records.** Whether readers need any sense of how well a record holds
  up, and whether that can be shown without becoming a score beside somebody's
  name. Not decided, and it may not happen.
