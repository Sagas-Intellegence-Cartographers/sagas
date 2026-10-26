# Sagas

A map-based archive of what people know about places.

Someone contributes what they know about a place, in whatever language they'd
tell it in. It stays attached to that place and attributed to them. Other people
add to it, or say where they remember it differently, and those disagreements
stay in the record instead of being resolved away.

The example data covers six places in Boise, with invented contributors. The
flagship is an invented corner shop that walks through how the pieces fit.
Nothing in the model is specific to that community, and the first archive built
on this could be anyone's.

This repository is the scaffold three university teams build against. It is
sponsored by [Civum PBC](https://crowdforge.dev).

---

**If you read one thing, read
[what your interface has to handle](./packages/fixtures/README.md#what-your-interface-has-to-handle).**
It lists the situations this project expects a real archive to be in, and it is the closest thing this project has to a specification. It takes about twenty minutes to read.

**If you read two,** find your layer in [SETUP.md](./SETUP.md#where-to-start-by-team)
and open the start guide it points at. That is your team's work and where to start on
it.

Everything else here is background, and you can come back for it.

---

## The problem

Written records capture ownership, dates, and architecture. What they don't
capture is who was actually in the room. That part lives in family memory and in the recollections of elders, and a lot of it never gets written down.

The obvious way to build this is a wiki: let people contribute, let the
community converge on one version, show that version. We think that's wrong for
oral history. Communities do not agree about their own past, and the
disagreements are often the most interesting part of the record. A system
that resolves them has thrown away the evidence.

So the design question is: **how do you keep a record that preserves
disagreement and still produces something readable?**

A wiki moves the disagreement onto a separate talk page. This project wants prose that carries the disagreement in the body of the text: "three people with independent records say 1914 and one says 1922, and
here is who each of them is."


## What the main terms mean

- **Site.** A place somebody has designated as meaningful. Records and claims
  attach to a site. A site does not attach to them.
- **Record.** What somebody hands over. A recording, a video, a photograph, a
  scanned document, or typed text. Nothing in the graph argues with a record.
  Disagreement lands on claims instead.
- **Claim.** Somebody's reading of a record, and the place disagreement lands. Each claim has one source record, the one its conversation started from, and can have evidence records attached. One record can be the source of several claims. "Conversation" is a working idea that may be dropped. The source record is what groups the claims read from it.
- **Rendering.** A transcript or a translation. One person's version of a
  record or a claim, attributed, with more than one allowed to exist.
- **Profile.** Who a contributor is to the software. This semester a profile is
  a guest id kept in browser storage, and there are no logins.

"Account" is not a term in this project. If you find it standing for a contribution or a login, that is a leftover and worth a pull request.

## How the pieces fit

People make **claims** about records: assertions that can be compared across sources. Claims are nodes in a directed graph. Two kinds of response
change the shape of that graph:

- **Dispute.** "I disagree with this specific detail, because." Disputes
  target a *detail* of a claim (a date, a place, a person). The rest of the
  claim stands, so a record can say "three disputes target the date; the location is
  undisputed." A dispute is a claim of its own, so it can carry evidence too.
  Disputes without reasoning are rejected.
- **Extension.** "I have more context." A new claim that adds to another without contradicting it. If it brings a new record, that record is attached as evidence. Like a dispute, an extension targets a detail, or the whole claim when it is about all of it.

A third response costs the reader nothing and creates no claim. A **passover**
is what somebody does on the way past: it says this sounds right, or that they
cannot judge it, or that it is not what they came for. Agreeing is one of those three, and it adds a little weight. The other two add no weight and only affect what gets suggested to whom. None of the three is a vote.

Weight moves with the edges. An extension pushes a claim up, a dispute pushes it
down, and a resolution would lift both branches it reconciles, so a claim's
standing moves in both directions over time. Corroboration is counted by
**independent record**, never by headcount: agreeing is not bringing a source.

There is no "community accepted" status and no endorsement threshold. The
highest-weight claim at a node renders as the primary reading; competing claims
stay visible inline.

A claim given in a language with no English rendering yet stays in the archive,
readable in the original at the place it belongs to, and sits outside the claim
graph until somebody renders it. It is never deleted. Several renderings can coexist, each credited. There is no slot for the
correct one.

## Layers, and who owns what

| Layer | Scope |
|---|---|
| **Experience** | The map and the reading experience: narrative page, component library, map, suggestion interface, and references (how a page shows what each claim rests on). Builds against the fixtures now, and later on the other layers' APIs, replacing their plain screens where polish matters. Heritage trails come later. Milestones and score dashboards are cut this semester. |
| **Intelligence** | Claims and the graph they form: scoring (weight and independence), exploration, and later a plain screen for writing claims and the sections and passages a page shows |
| **Content** | Records: media pipeline, record submission and the contributor's choices, transcription and translation by time window, moderation of records, and a plain screen for handing things over |
| **Contracts & fixtures** | `packages/contracts`, `packages/fixtures`, maintained by the sponsor |

Each layer has its own app or apps, so no two teams edit the same files:
`apps/web` + `apps/ui-api` + `packages/read-model` for experience,
`apps/graph-api` for intelligence, `apps/capture-api` +
`apps/capture-web` for content. Each app has a `README.md` that says what goes where.

Each school forks this repo into its own GitHub organization. All student work
happens in the fork, for grading. Pull requests back to this repository are welcome and get reviewed.
[`docs/GIT.md`](./docs/GIT.md) has the mechanics.

## What's in here

This is a pnpm workspace. Every folder under `apps/` and `packages/` is its own package
with its own `package.json`, and they refer to each other by name.

**Start with the row for your layer.** You can ignore most of the rest.

| Package | Owner | What it is | Open it when |
|---|---|---|---|
| `apps/web` | Experience | The site. Next, React, Tailwind. Components are stubs with instructions in them. | Always. This is the layer. |
| `apps/ui-api` | Experience | Read API over the archive for the browser. Empty. | You are building the back end for the site. |
| `packages/read-model` | Experience | Data access shared by the two above. Reads fixtures today. Putting a database behind it is your job. | First infrastructure job on that layer. |
| `apps/capture-api` | Content | Submission, uploads, transcription and moderation. Empty. | Always. This is the layer. |
| `apps/capture-web` | Content | The contributing interface, where somebody hands something over. Empty. | Always. This is the layer. |
| `apps/graph-api` | Intelligence | Scoring, the graph, geographic queries, and the schema behind them. Empty. | Always. This is the layer. |
| `packages/contracts` | Sponsor | The shapes, defined once, with the reasoning next to each one. | Constantly. Read it before you build anything. |
| `packages/fixtures` | Sponsor | Invented data, the states derived from it, and the rules your code has to obey. | Before you call anything done. |
| `tooling/*` | Shared | ESLint, Prettier, Tailwind, TypeScript and continuous integration config. | Rarely, and think before you change it. |


**`packages/fixtures` is not just test data.** It holds an authored log of contribution events for each of six sites, four snapshots calculated from each log, a list of situations your
interface has to handle, and a suite of rules any scoring implementation has to
pass. See below.

**Each layer runs its own database on purpose.** The content layer stores what
people hand over, the intelligence layer stores claims and the graph derived
from them, and the experience layer runs a read model shaped for map and article
queries. None of them reads another's tables, so no team can be blocked by
another team's migration. Each layer's schema and migrations live in the app
that uses them, and that app's README explains the split.

**Where a thing lives.** Code that more than one app uses goes in `packages/`. Code that one app uses stays in that app.

`packages/contracts` and `packages/fixtures` are shared because all three layers
build against the same shapes. `packages/read-model` is shared because both
experience apps import it. A schema is not shared, because each layer designs
its own and they are meant to differ, so it lives in the app that queries it.

## How the fixtures let the layers work in parallel


No layer waits on another. All three build against the same fixture data, and
that data is maintained by the sponsor. When work on one layer reveals that the
model is wrong, the fixture changes. The other layer sees it as a versioned
contract change, discussed at a check-in. It never arrives as a broken build.

The file that matters most is `packages/fixtures/README.md`. It lists the situations the record can be in and what your code has to do about each one. They are
deliberately awkward. A sparse site with three claims and no corroboration is
harder to render honestly than a rich one, and this project expects most real sites to look like that.

Read that file before you consider anything done.

It also lists the situations no fixture covers yet. Adding a fixture for one of them is a useful pull request.

## Things we know are unfinished

[`docs/DESIGN-QUESTIONS.md`](./docs/DESIGN-QUESTIONS.md) lists the decisions in
this codebase that we think are wrong, have not settled, or decided for reasons that may not hold up once real work starts.

It's sorted by how much conversation an answer needs. The first section is
things you could fix in a pull request this afternoon, and the last section holds problems this project has no answer to.

Read the part that touches your work before you refactor something, because a
few things in there look like sloppiness and aren't. If you find a question we
missed, adding it is as useful as changing the code.

## Getting started

```bash
pnpm install
cp .env.example .env      # then add your own Mapbox token
pnpm fixtures:build       # regenerate derived states, print a readable dump
pnpm acceptance          # check the fixtures against the contract
pnpm dev:web              # the experience layer
```

You need Node 22.10 or later, pnpm 9, and Docker. **[SETUP.md](./SETUP.md)** has the rest:
registering a Mapbox token, running the local database, object storage and
ffmpeg for the content layer, and which file to open first depending on which
layer you are on.

**There are no sponsor-provided credentials.** You register your own free-tier
Mapbox token, and Postgres runs locally when it's needed. Nothing in this repo
talks to a service you need our permission to reach. If a task appears to
require a key you don't have, that's a bug in the scaffold. Tell us.

## What the scaffold deliberately does not include

- **A design system or design tokens.** The experience layer builds its own component library, starting in its first week.
- **A synthesis engine.** Nothing works out what a narrative should say. The
  experience layer reads derived graph states, which is enough to build every
  view in its scope, and the intelligence layer builds the real thing later.
- **Any database schema.** Each team designs their own. The experience layer
  needs a read model shaped for map and article queries, the intelligence layer
  needs a store for claims and the graph, and the content layer needs one for
  what people hand over. The shapes in `@sagas/contracts` are the constraint,
  and how they get persisted is the work.
- **An upload pipeline.** Object storage is running and empty. Presigned
  uploads, transcoding, and metadata extraction are the content layer's build.
- **A scoring algorithm.** `packages/fixtures/src/stand-in-score.ts` is an
  invented stand-in, in the shape the real scorer returns, so claims have an
  order to render. Do not treat it as a baseline to beat. The intelligence
  layer's scorer replaces it.

If it feels like something is missing, check whether it's on this list before
assuming it's an oversight.

## Working together

Check-ins, office hours, how pull requests are reviewed, and the rules for when
the contract changes are in
[`docs/WORKING-TOGETHER.md`](./docs/WORKING-TOGETHER.md).

The two that matter most on day one: **open pull requests small and early**, and
**your fork is pinned, so nothing changes under you mid-sprint.**

## The fixture data is invented

Every contributor, family, and event in the fixture data is **invented**. Some sites use a real building, street or coordinates and some are invented outright, and the comment at the top of each site's `events.ts` says which. It exists to
exercise the data model.

Do not display it publicly, cite it, or show it to community members as though
it were testimony. No fixture site stands for a real community.

The point of the project is that what a person says about their own family stays theirs and stays attributed. Synthetic data
that reads as real testimony cuts against that, so we label it at every level:
in the data, in the schema, and here.

## License and credit

Apache 2.0. The full text is in [`LICENSE`](./LICENSE).

Fork it and build on it. Your fork is yours, and work a student writes there
stays theirs. Nobody needs permission to put it in front of an employer.

Anything merged upstream is credited by name, and the commit history stands as
the record either way. This project is about keeping what people contribute attached to them, and that applies to the people writing the code too.

## How this scaffold was built

The scaffold was developed with AI assistance. Everything in it was reviewed
before it landed, and the acceptance suite and scoring rules are here so that
correctness is demonstrable rather than taken on trust.

---

Sponsored by Civum PBC · stanton@civum.io
