# Experience layer backlog

The work for this layer, grouped into epics. Each epic starts with a few stories
and gains more at each specification meeting, as the earlier ones land. If an
epic looks thin, that is why.

**How to read a story.** Each `###` heading is one story, written so it can be
pasted into a GitHub issue as it is: the heading is the title and everything
under it is the body. Whether your team tracks them as issues is up to you.

- **Goal** says what the story is for.
- **Done when** is what gets checked at the specification meeting.
- **Not in this story** is there so a story does not quietly grow.
- **Status** says whether it can start now, and if not, which stories it waits
  on.
- **Read first** names documents to read before starting, if any.

A story that turns out to be wrong, too big or unclear is normal. Say so in the
check-in note and it gets rewritten.

Status key: **Ready** (can start now), **Later** (written, waiting on the
stories named), **Draft** (direction only, gets detail at a specification
meeting).

When a story says "write down why", put it in the pull request description.

---

## Sprint one

The first sprint under `STATEMENT-OF-WORK.md`, two or three issues per
workstream. It replaces epic A as the first sprint. Epic A's stories are still
below, and the table "Where the earlier stories went" says where each one went.

### P1 · The pipeline on GitHub Actions

**Workstream:** Platform. **Status:** Ready

**Goal.** The checks that already exist run in the fork, block a merge when they
fail, and are ready to deploy from.

**Done when:**
- `.github/workflows/ci.yml` (typecheck, lint, acceptance criteria, tests) runs
  on every pull request in the fork, and a failure blocks the merge.
- The team's own workflow files say in comments what each job is for.
- A deploy step is ready to switch on once P2 is approved. Switching it on is
  part of P3.

**Not in this story.** A preview for each pull request, and the full app's
hosting. Both come later, by proposal.

**Read first.** "Turn on the upstream watch" in `docs/START-EXPERIENCE-LAYER.md`,
which covers switching Actions on in a fork.

### P2 · Hosting and domain proposal

**Workstream:** Platform. **Status:** Done. The landing page runs on Cloudflare
Workers, on the free plan, at `sagasproject.org`. See "Deploying it" in
`README.md`.

**Goal.** A recommendation, with costs, for where the landing page and later the
full app run, and what the domain is.

**Done when:** a short written proposal covering:
- At least three hosting options with free tiers, compared on what this project
  needs: a static page now, then a Next.js app, a small API and a Postgres
  database. Say what each costs per month and where its free tier ends.
- A shortlist of available domain names with their yearly price.
- A recommendation for each, and why.

**Not in this story.** Signing up for anything. The sponsor signs up once the
proposal is approved.

### P3 · The landing page

**Workstream:** Platform, with the copy from Design (De2). **Status:** Ready to
build. P2 is approved. Deploying waits for the copy to be approved.

**Goal.** A small public page for Sagas, deployed by the team's own pipeline.

**Done when:**
- A small static app in the fork (for example `apps/landing`) builds, and
  merging to the main branch deploys it.
- The copy is the one the sponsor approved (De2), and nobody outside the team
  sees it before that.
- No organization is named, and anything invented is marked as invented.

**Not in this story.** A sign-up form or a changelog section. Both come later.

### Da1 · The read model against a local database

**Workstream:** Data. **Status:** Ready

**Goal.** `packages/read-model` answers from Postgres instead of JSON files,
and nothing that calls it has to change.

**Done when:**
- The local database (`pnpm db:up` in `apps/ui-api`) holds the corner shop, and
  `listSites()` and `getSiteState()` read from it.
- `/dev` looks the same as before.
- A note on the data model: what is stored, what is worked out per request, and
  a proposal on two open questions. Should the database store events (each
  thing a person did) or snapshots (what a site looks like at one moment)? And
  where does a claim's weight live, given that weight is on claims and details?

**Not in this story.** Hosting the database.

**Read first.** Story A5 below, and the comments in
`packages/read-model/src/index.ts`. If you started A5, that work carries over.
A5 now models sections from the shared contract and groups claims by source
record.

### Da2 · A seed script for any database

**Workstream:** Data. **Status:** Later. Needs Da1.

**Goal.** Loading the fixtures into a database is one command, so moving to a
hosted database later only means a new connection string.

**Done when:** one script loads every fixture site into whichever Postgres
database a connection string points at, and running it twice does not duplicate
anything.

### Da3 · What the page needs from the data

**Workstream:** Data. **Status:** Ready

**Goal.** A written list of what the map and the narrative page need that the
fixtures do not have yet.

**Done when:** the list exists, each item says which screen needs it, and
anything that should be shared is opened as a pull request upstream with the
reason.

### M1 · The map and the list

**Workstream:** Map and discovery. **Status:** Ready

**Goal.** Old stories B1 and B3 together: a real map with the fixture sites as
pins, and a list view that has everything the map has.

**Done when:** see B1 and B3 below. Both have to work, with and without a
Mapbox token.

### M2 · Search by name and by map area

**Workstream:** Map and discovery. **Status:** Later. Needs M1.

**Goal.** Somebody can find a site by typing part of its name, or by moving the
map.

**Done when:** a search field filters sites by name, other names and address,
and the list follows the area the map shows. It works from the keyboard.

### M3 · Site icons

**Workstream:** Map and discovery. **Status:** Ready

**Goal.** A pin says at a glance what kind of place it is, and roughly how well
documented, without a number. This replaces the pin band in B1.

**Done when:** a small set of icons, in the style the design workstream is
working toward, used on the map and the list.

### N1 · The corner shop at t3 as a page

**Workstream:** Narrative page. **Status:** Ready once contract 2.1.0 is in
your fork. Start from `PAGE-MODEL.md` before then.

**Goal.** The site page from `PAGE-MODEL.md`, built in the app.

**Done when:**
- The site's sections render with their headings and passages, from
  `sections` and `compositions` (contract 2.1.0).
- A site with no sections shows its records on their own, without looking
  broken.
- Both readings of the disputed date can be seen side by side.

**Read first.** `PAGE-MODEL.md`, then open `page-model.html`.

### N2 · A phrase opens the claims behind it

**Workstream:** Narrative page. **Status:** Later. Needs N1.

**Goal.** Selecting a phrase in a passage shows the claims it rests on.

**Done when:**
- Selecting a phrase shows the claims named by its span, ordered by weight,
  with extensions under the claim they add to.
- When the span names details, the detail's words are highlighted in the claim.
- It works from the keyboard, and the reader can get back to where they were.

### N3 · Step from t0 to t3

**Workstream:** Narrative page. **Status:** Later. Needs N1.

**Goal.** Watch the page change as the site's history arrives.

**Done when:** a control moves between the four states and the page re-renders,
including t0 with no sections. It is a tool for building and checking, so it can
live on `/dev`.

### De1 · Wireframes for the landing page and the map

**Workstream:** Design. **Status:** Ready

**Goal.** The other main screens, built on the page model.

**Done when:**
- Wireframes, sketched or in a design tool, for the landing page and the map
  with search, each with a short note on what a person sees when there is
  almost nothing at a place.
- A first set of design tokens (colors, spacing, type sizes) that the
  components use (from story A1).

**Read first.** `PAGE-MODEL.md`, and "Design direction" in
`STATEMENT-OF-WORK.md`.

### De2 · Landing page copy

**Workstream:** Design. **Status:** Ready

**Goal.** The words on the landing page, ready for the sponsor to approve.

**Done when:** a draft goes to the sponsor in the questions issue. It names no
organization and marks anything invented.

### De3 · What is missing and what would be nice

**Workstream:** Design. **Status:** Ready

**Goal.** A list of what the product lacks, from the side of somebody using it.

**Done when:** the list is brought to the specification meeting.

### Where the earlier stories went

| Old story | Where it went |
|---|---|
| A1 component library | Built as the page and the map need parts. The tokens are in De1 |
| A2 front-end test setup | Later, as component tests and an accessibility check in the pipeline (see the statement of work) |
| A3 Storybook investigation | Later. See "The backlog behind sprint one" in `STATEMENT-OF-WORK.md` |
| A4 mockups | De1, now that the site page has a page model |
| A5 entity relationship model | Da1. Keep what has been done |
| B1, B3 | M1 |
| C0 | Da1 and Da2 |

### Template for a new story

Copy this into a new issue, or under an epic below.

```
### <short id> · <what it does, in a few words>

**Workstream:** <one of the five>. **Status:** Ready / Later. Needs <ids> / Draft

**Goal.** <one or two sentences: what it is for>

**Done when:**
- <something checkable at the specification meeting>
- <...>

**Not in this story.** <what it could grow into, and should not>

**Read first.** <documents, if any>
```

---

## Epic A — Foundations (the original first sprint)

Five pieces that can run in parallel, one per person. Together they let
everything after this be built by several people at once.

### A1 · Component library for the renderer

**Status:** Ready

**Goal.** The shared building blocks every view uses, so five people build the
same page from the same parts.

**Done when:**
- `src/components/ui` holds the generic pieces the first views need: at least
  text styles, a button, a card or panel, a tag or label, a tooltip, and a
  dialog.
- Colors, spacing and type sizes are defined once, as design tokens (named
  values like `--space-2` or `text-muted`), and components use the tokens rather
  than raw values.
- Every component meets the color contrast level of the Web Content
  Accessibility Guidelines (WCAG) 2.1, level AA, and every interactive one works
  from the keyboard.
- Nothing in `src/components/ui` imports from `@sagas/contracts`. If it needs to
  know what a claim is, it belongs in `src/features`.
- A short `src/components/ui/README.md` says what exists and how to add to it.

**Not in this story.** Sagas-specific components such as a claim or a dispute.
Those come in epic C and are built from these.

**Worth knowing.** `src/components/ui` already follows the shadcn/ui convention
for where primitives live, as its README explains. You are free to use shadcn/ui
or not. Decide as a team and write down why.

### A2 · Front-end test setup

**Status:** Ready

**Goal.** A test can render a component. Today only the pure functions beside
the components are tested.

**Done when:**
- The Vitest setup in `apps/web` is extended so a test can render a React
  component and query what it shows. Testing Library is the usual choice. Pick
  it or something else and say why.
- An automated accessibility check runs in at least one component test. Which
  library does it is your choice. Write down why.
- The existing `IntegrityBadge` and `ConfidenceIndicator` tests still pass, and
  there is one new rendering test for each as an example.
- `pnpm --filter @sagas/web test` runs everything, and the output shows the new
  tests actually ran. A test file outside Vitest's include list is skipped
  silently while the run still reports success, so check the count.

**Not in this story.** End-to-end browser tests. Those can come later.

**Worth knowing.** Test what a component does. "A thin record is never described
as failing" is worth a test. "This div has this class" breaks every time
somebody improves the design.

### A3 · Storybook investigation

**Status:** Ready. Time-boxed to a few days.

**Goal.** Find out whether Storybook is worth adopting here before anybody
depends on it. `/dev` already does part of its job.

**Done when:** a short write-up, in the pull request or a markdown file,
answering:
- What it takes to run Storybook in this repository: Next 15, Tailwind, a pnpm
  workspace. What had to be installed or configured.
- Whether a Mapbox map can render inside it, and what that needs.
- Whether the fixture states and their acceptance criteria can sit beside each
  component the way they do on `/dev`.
- A recommendation: adopt it, or keep `/dev`.

If adopting is cheap, a working setup with one story for `IntegrityBadge` is a
good end point. If it is not, the write-up alone is a complete result.

**Not in this story.** Stories for every component.

### A4 · Mockups for the first tasks

**Status:** Ready

**Goal.** Agree what the first screens look like before building them.

**Done when:** mockups, sketched or in a design tool, for:
- The map with a search bar, and what happens when you pick a result (see B2).
- A site page at `t0` (one contributor, nothing corroborated) and at `t3`
  (several source records with claims, a dispute, a translation).
- One source record and the claims made from it, including a detail that
  somebody disputes.
- A short note with each screen saying what a person sees when they are the
  only contributor at a place.

**Not in this story.** Final visual design. These are for arguing with.

**Read first.** `docs/HOW-THE-LAYERS-FIT.md` and the fixture README section
"What your interface has to handle".

### A5 · Entity relationship model from the reading side

**Status:** Ready

**Goal.** Decide what your database holds, shaped for drawing a map and a page.

**Done when:**
- A diagram of the entities a page needs (sites, sections, source and
  evidence records, claims, the details people point at, disputes, extensions, renderings,
  contributors) and how they relate.
- A note on what is stored ready to draw versus worked out per request. Example:
  whether a site's list of sections is stored or built on each read.
- A first migration in `apps/ui-api` that creates the tables, run against the
  local database started with `pnpm db:up`. There is no migration tool in
  `apps/ui-api` yet, so choosing one is part of this story. Write down why.

**Not in this story.** Loading the fixture data into it (C0), and matching the
other layers' schemas, which is not a goal.

**Worth knowing.** "Conversation" is a working idea that may be dropped, so do
not model it as its own table. Group claims by source record, and take sections
from the shared contract.

---

## Epic B — Finding a place

The map and the list. Concrete work that can start as soon as A1 has a few
components.

### B1 · Mapbox map with the fixture sites as pins

**Status:** Ready

**Goal.** Replace the TODO in `src/features/map/MapView.tsx` with a real map.

**Done when:**
- With `NEXT_PUBLIC_MAPBOX_TOKEN` set, the map renders every site from
  `listSites()` as a pin, centered on the sites.
- With no token, `MapUnavailable` still renders the list. Both paths work.
- Pins show at a glance whether a place is thinly or well documented, using the
  band from `IntegrityBadge`. No number is shown.
- Clicking a pin opens that site's page.

**Worth knowing.** `mapbox-gl` is already a dependency. Coordinates are
`[longitude, latitude]`. Each person registers their own free token, and nobody
commits one.

### B2 · Search bar that finds an address and drops a pin

**Status:** Later. Needs B1.

**Goal.** Somebody types an address or a place name and the map goes there.

**Done when:**
- A search field on the map suggests matches as you type.
- Choosing one moves the map there and drops a pin.
- The fixture sites in view stay visible as pins after the search, so a site
  near the result is one click away.
- It works from the keyboard and with a screen reader.

**Part of the story:** find out which Mapbox service does address search, what
its free allowance is, and whether results may be stored. Write down what you
found and where you found it.

**Not in this story.** Creating a new site from the dropped pin. Creating sites
is not part of this layer's work.

### B3 · The list view has everything the map has

**Status:** Ready

**Goal.** Somebody who cannot use the map loses nothing.

**Done when:**
- A list view shows every site the map shows, and it is reachable whether or not
  a Mapbox token is set. `MapUnavailable` is where it starts.
- A search field filters the list by site name, other names (`aka`) and address.
  This searches the fixture data, so it works with no Mapbox token.
- Each entry says in words how well documented the place is.

### B4 · Only load the sites in view

**Status:** Later. Needs A5 and C0.

**Goal.** The map asks only for the sites inside the visible area.

**Done when:** `listSites()` takes a bounding box, the database answers it with
a spatial index, and panning the map loads new sites. See `docs/GIS.md`.

---

## Epic C — The narrative page

How the claims at a site become a page. `apps/web/DIRECTION.md` has what is
decided and what is open. These first stories render what the fixture already
has.

### C0 · Load the fixture states into your database

**Status:** Later. Needs A5.

**Goal.** `packages/read-model` reads from Postgres instead of JSON files.

**Done when:** a seed script loads every fixture state, the read functions query
the database, and `/dev` looks the same as before.

### C1 · Render one source record and its claims

**Status:** Later. Needs a few A1 components and the A4 mockup of one source
record.

**Goal.** The source record and the claims made from it, readable in order.

**Done when:**
- A component takes a source record and its claims and renders them, using A1's
  components.
- Each claim shows who made it and when.
- It renders against all four states on `/dev` without looking broken at `t0`.

### C2 · Disputes on a detail

**Status:** Later. Needs C1.

**Goal.** When somebody disputes one detail of a claim, the disagreement shows
at that detail and the rest of the claim reads as undisputed.

**Done when:**
- `src/features/article/DetailDisputes.tsx` shows every reading of the disputed
  detail, each with its reasoning and who gave it.
- The claim's own reading stays in place in the sentence, and the competing
  readings sit visibly beside it. Nothing marks either as the answer, and there
  is no vote count.
- A dispute of the whole claim names no replacement for this detail, and it still shows,
  as an objection with its reasoning.

See "Disagreement lands on one detail" in
`packages/fixtures/README.md`. The corner shop site at `t2` has a clean example.

### C3 · Where a claim comes from

**Status:** Later. Needs C1.

**Goal.** Every claim reaches the person who made it, its source record, and any
evidence records attached to it.

**Done when:** `src/features/article/SourcePanel.tsx` shows these, and a claim
whose author is not the person who handed over the record makes that clear.

### C4 · Translations and transcripts side by side

**Status:** Later. Needs C1.

**Goal.** A claim with no English rendering is readable in its original, and a
claim with several renderings shows all of them, credited.

**Done when:** `src/features/article/TranslationPanel.tsx` handles no rendering,
one, and several, as its own comment describes.

---

## Epic D — Suggestion

**Status:** Draft. Starts with a design exercise. Code comes after it.

How a reader is pointed at what to read next and what they could add. The
routing that decides this now sits with this layer, as backlog work, and your statement of
work doesn't change. It doesn't exist yet. It reads profiles and each person's passovers, which the scoring graph
in `packages/fixtures/scoring` carries, so it can run without the scorer. `graphState` only has
totals. This epic designs the interface first. The passover interaction joins this epic once
the design exercise is done. The intelligence layer's matching plugs in later as one more
input.

### D1 · Design exercise: the suggestion interface

**Status:** Draft. Gets detail at the first specification meeting.

**Goal.** A proposal for how the interface suggests content to a reader,
worked through the way a product design exercise is: who the user is, what they
are trying to do, what the system knows, and what the screen does about it.

**The brief.** Think of designing a site like Reddit, with the
constraints this project adds. There are no vote counts and no scores shown to
anyone. Agreement is not evidence. A claim nobody has responded to is not
doubted, it just has not reached anyone who knows. What does a reader see that
makes them want to read on, and makes somebody who knows something want to
add it?

**Done when:** mockups plus a page of reasoning, brought to a specification
meeting. Stories to build it come out of that meeting.

---

## Epic E — References

**Status:** Draft.

How claims, records and renderings cite each other on the page, and how
somebody links to one claim. See `apps/web/DIRECTION.md`. Stories get written
once C1 and C3 exist.
