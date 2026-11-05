# Statement of work: the experience layer

What this layer is building, how the work is divided, what the team decides on
its own, and how the work is judged. It replaces the first-sprint plan in
`docs/START-EXPERIENCE-LAYER.md` where the two disagree.

## What this team is building

This team builds the whole reading product for Sagas. Somebody finds a place,
reads what people have said about it, explores the claims it was built from, and
later adds to it. This team owns what that person sees, and everything
needed to put it in front of them: the pipeline, hosting, and the data the page
reads.

The bar is to make it good and worth using. How it gets built is the team's
call, inside the limits below.

Two other layers sit on either side of this one. The content layer builds the
working way to hand over a record (uploading, recording, the submission form),
in `apps/capture-api` and `apps/capture-web`, and real submissions go through
it. This team can design contributing as part of the whole product, in
`apps/web`, against invented data. Anything it submits for real goes through the
content layer's API. The intelligence layer owns the scoring that orders claims.
This team builds against the shared contract and fixtures.

## How we work

The team works as a contracting team, and the sponsor is the client. The sponsor
says what is wanted, what he provides and how it is judged. The team decides how.

**Open choices go through a proposal.** For anything open, like a tool, a host,
a provider or a data model, the team researches it and brings back a short
written recommendation, including what it would cost per month. The sponsor
approves it or pushes back, and then the team builds it.

**Who decides what.**

| The team decides alone | The team decides and writes it down | Needs the sponsor first |
|---|---|---|
| Libraries and tools inside the app | Moving away from Next.js | Anything that costs money |
| Component structure, code style, tests | The migration tool | Signing up for any service, or buying anything (the sponsor does this) |
| Its own database schema | Adding a service or a container | Public copy, and anything shown to people outside the team |
| How issues are split and who takes them | Anything that changes how another workstream works | Changes to `packages/contracts` or `packages/fixtures` (a pull request upstream) |
| Design, inside the model's rules | | Anything that would hold real personal data, such as a mailing list or real records |

"Writes it down" means a one-page decision record in the fork: what was
decided, what else was considered, and why. The sponsor reads it and can push
back, and the team carries on without waiting for an answer.

**Questions for the sponsor** go in one standing issue in the fork, titled
"Questions for the sponsor". The sponsor answers at least weekly. Anything
urgent goes by email, through the product owner, with a reply within a working
day.

**Before a specification meeting,** post questions and agenda items in the same
issue by 4pm the day before. That gives the sponsor time to prepare. Anything
raised later gets a written answer in the issue that week.

**The sponsor doesn't watch the fork and gets no alerts from it.** Anything that
needs him goes in the questions issue, mentioning him by his GitHub username so
he gets a notification: a decision, an approval, or running out of work.
Everything else he sees at the specification meeting.

**Pull requests.** Every change goes through a pull request, and a teammate
reviews it. Once a teammate has approved it and the checks pass, merge it
without waiting for the sponsor. He looks at what lands and asks for a revert if
something needs to come back out. For this team, that replaces the review before
each check-in described in `docs/GIT.md` and `docs/WORKING-TOGETHER.md`. Squash feature pull requests. Merge a pull
request that syncs from upstream with a merge commit (`docs/GIT.md` says why).

**What goes upstream.** Feature code stays in the fork. Only changes to
`packages/contracts`, `packages/fixtures` and corrections to the shared docs go
upstream, as a pull request.

**The changelog.** Keep this layer's changelog in `apps/web/CHANGELOG.md`. Add a
line whenever something works that someone could see. Leave the `CHANGELOG.md`
at the root of the repository alone. That one records the shared contract and
the shared docs, and upstream changes it, so editing it means a conflict on a
later pull.

**Demos.** Anything in the changelog since the last specification meeting is
what gets shown, running.

**Updates.** The product owner sends the sponsor a short email every Thursday:
what's done, what's next, and anything stuck. Informal is fine.

**When you finish or get blocked,** take the next item in your workstream from
"The backlog behind sprint one" below. Write the issue yourself with the
template under "Template for a new story" in `BACKLOG.md`, and mention the sponsor in
the questions issue so he can check it. If your workstream is empty, take
something from another one or from "Anyone", and say so in the issue. Waiting
quietly costs the team a week.

**When the docs and the contract disagree,** build against the contract in
`packages/contracts`. That's what exists today. Post the mismatch in the
questions issue so the sponsor can fix whichever one is wrong.

**Before anything real exists,** build and test in the local setup against the
fixture data. The hosted database is for when a feature needs to save
something.

## The limits

1. **The model's rules.** No score or ranking is shown to anyone, and no count
   of how many people agree. Nothing
   looks settled. Disagreement stays visible, side by side. A claim nobody has
   answered never looks rejected. Every claim leads back to its author and its
   records.
2. **Free tiers for as long as they last.** This is an open source project.
   Anything paid needs the sponsor's approval first, and every proposal says
   what it would cost per month.
3. **Nothing real on infrastructure the team runs.** This includes the hosted
   database the sponsor sets up for the team. All data is invented or public
   record, and invented data is marked as invented. Real testimony and real
   personal data wait for the sponsor's own hosting.
4. **No organization is named** on anything public until it has agreed to be.
5. **The shared contract changes by pull request.** The team's own schema, and
   any extra test data kept in its own apps, are free to extend. Changes to
   `packages/contracts` or `packages/fixtures` go upstream as a pull request
   with a written reason, and the sponsor decides what gets added.

## Design direction

There is no brand to match, so Sagas gets its identity from what this team
designs. It serves two kinds of reader at once. One is somebody who knows
something about a place, picking it up on a weeknight to add to it, so it has
to be easy and a little fun. The other is a historian or an archivist who will
eventually treat what Sagas holds as a starting point for their own work, so it
has to look trustworthy enough to cite.

The interface should be simple, with that simplicity backed by careful work
underneath. The narrative page starts out reading like an encyclopedia entry,
in sections. Where it goes from there is open, and this is where the design
freedom is meant to be spent: sections as separate floating blocks, exploring
regions of claims rather than one claim at a time, and clean transitions between
the page and the claims behind it.

A few things are fixed. The page works before it is polished. Color contrast
meets the level already set in story A1, colors and spacing are defined once as
design tokens, and it works on a phone.

## What the sponsor provides

- The page model (`PAGE-MODEL.md`) and the definitions (`DEFINITIONS.md`).
- A hosted database, set up in its own project, with access for the people who
  need it.
- The domain, `sagasproject.org`, and its settings in Cloudflare.
- The Cloudflare account the landing page deploys to, and a deploy token for
  the pipeline.
- Sign-ups for any hosting the sponsor approves.
- Answers in the standing questions issue, at least weekly.
- Real material when it exists, starting with public-record facts.

## Workstreams

The product owner assigns these. Interface work is open to everyone.

| Workstream | Owns |
|---|---|
| Platform | The pipeline, hosting, the domain and the landing page build |
| Data | `packages/read-model`, `apps/ui-api`, the database, and what the page needs from the fixtures |
| Map and discovery | The map, search, pins and the list view |
| Narrative page | Turning claims into a readable page |
| Design | Wireframes, style, the landing page copy, what is missing |

## Sprint one

Two or three issues per workstream. They are written out in `BACKLOG.md`, under
"Sprint one", in the same format as the rest of the backlog.

- **Platform.** The pipeline on GitHub Actions, building on the checks that
  already run in `.github/workflows/ci.yml`. A hosting and domain proposal, with
  costs (done: see "Deploying it" in `README.md`). The landing page, built and
  deployed.
- **Data.** The read model against local PostGIS, seeded from the corner shop. A
  seed script that loads the fixtures into any Postgres database. A written list
  of what the page needs from the data. The data model (earlier story A5) starts
  here. Two questions in it need a proposal: whether to store events or
  snapshots, and where a claim's weight lives.
- **Map and discovery.** The map with the fixture sites as pins, plus the list
  view. Search by name and by map area. Site icons.
- **Narrative page.** The corner shop at t3 as a page, phrases that open the
  claims behind them, and stepping from t0 to t3.
- **Design.** Wireframes for the landing page and the map, built on the page
  model, and the design tokens. The landing page copy, for the sponsor to
  approve. A list of what is missing and what would be nice.

## The backlog behind sprint one

Anyone who finishes an issue can take the next one in their workstream without
asking. These get full "done when" text when they are picked up.

- **Platform.** Containers for the web app and `ui-api`. Seeding the hosted
  database from the pipeline. Component tests and an accessibility check in the
  pipeline (earlier story A2). Catching
  drift from the upstream contract. A changelog section on the landing page.
  What would make the project leave GitHub Actions, and a short comparison of
  free alternatives.
- **Data.** Moving to the hosted database. Loading only the sites in view, with
  a spatial index (story B4, shared with Map and discovery).
- **Map and discovery.** Address search that drops a pin (story B2).
- **Narrative page.** Disputes on a detail (story C2). Where a claim comes from
  (story C3). Translations and transcripts side by side (story C4). Transitions
  between the page and the claims behind it.
- **Design.** Visual direction past the wireframes. What a place with one
  contributor looks like. The suggestion interface (story D1 in epic D).
- **Anyone.** Storybook or `/dev` (story A3).

## Later, by proposal

- Hosting the full app.
- A mailing-list form on the landing page.
- A preview for each pull request.
- Kubernetes, Helm, or a second language for a service.

## Open design questions for this team

Nobody has designed these. A proposal from the team is useful input.

- **A view for researchers.** How historians and archivists would explore Sagas:
  search across sites, follow a claim to its records, cite or export.
- **How sections are laid out on a page.** Which claims form a section, and
  what its heading says, are the intelligence layer's work. The contract gives
  this team the shape to build against.
- **How a passage is shown and explored,** and how far the page can move from an
  encyclopedia entry. How a passage gets written is the intelligence layer's
  open work. The fixtures carry invented passages so the page can be built now.
- **Passovers that do not steer people.** A passover is the light signal a
  reader leaves on a claim: "sounds right", "don't know" or "don't care". This
  project hides the counts, and expects that hiding them may not be enough on
  its own, since the order and prominence of things on a page can also nudge
  people. How does a reader leave a passover without being steered by what
  others did?

## How the work is judged

- Each issue's "done when", checked at the specification meeting every two
  weeks.
- A short demo at each specification meeting of what landed.
- Every merged pull request passes the pipeline.
- Everything a reader sees follows the model's rules.
