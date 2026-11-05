# The parts of the experience layer

Short definitions of the parts this layer builds, so the backlog, the statement
of work and the page model all mean the same thing by the same word. The terms
for the data itself (site, record, claim, detail, rendering, profile) are in
`docs/START-EXPERIENCE-LAYER.md`.

## Narrative page

The page for one site. It is what a reader comes for, and it is the center of
this layer.

It is made of **sections**. Each section has a heading and a passage, and the
passage is written from the claims about the place. Phrases in the passage lead
back to the claims behind them. A site with no sections, because nothing has
been claimed yet or because none have been written, shows its records on their
own.

The shape of a section comes from the shared contract (`section` and
`composition`). They arrive in contract 2.1.0, which reaches your fork with the
next upstream update. How sections are chosen and how passages are written is
not decided, so the fixtures carry invented ones for now, for the corner shop
only. See `PAGE-MODEL.md` for a worked example.

## Claim exploration

Going from the page into the claims behind it. A reader selects a phrase and
sees the claims it rests on: who made each one, when, from which records, what
extends it, and where somebody disagrees. Two readings of a disputed detail sit
side by side.

Claims connect to each other, by extending or disputing, and together they form
a graph. The narrative page is one way into it, a summary. Claim exploration is
the other, and it is how a reader checks the summary. How deep it goes, and how
a reader keeps their place on the way down, is this layer's design work.

## Renderer

The code that turns contract data into what a reader sees: the components in
`src/features` that take a site's state and draw the page, a claim, a dispute or
a record.

Not to be confused with a **rendering**, which in this project means a
transcript or a translation. A renderer can show a rendering.

## Suggestion

How a reader is pointed at what to read next, and how somebody who knows
something is pointed at where they could add it.

Suggestions go where attention is needed. Popularity plays no part. Attention
is needed at a long chain of disputes, a claim with many disputes, an extension many people have
passed over with "don't know", a question nobody has picked up. They differ
from person to person. This layer works out the signals and
designs what the reader sees, and builds it first against invented signals.
Nothing in a suggestion is shown as a score or a count.

## Record capture

Handing over a record: recording audio, uploading a photograph, typing up what
somebody said.

The content layer builds the working version, in `apps/capture-api` and
`apps/capture-web`, and real submissions go through it. This layer can design
contributing as part of the whole product, in `apps/web`, against invented
data. Anything submitted for real goes through the content layer's API. Each
team works in its own app, so two teams never edit the same screens.

Leaving a passover
("sounds right", "don't know", "don't care") is this layer's interaction,
because it happens while reading. What a passover means is the intelligence
layer's.
