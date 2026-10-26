# Start here — experience layer

This repository is bigger than your part of it. Most of what is here belongs to
the other two layers and you can ignore it. This page is the short version, and
it is the one to come back to.

## If you read an earlier version of this page

The design has moved since the first version. The biggest change is that the
first version counted support by "family line", which the system has no way to
know, because it records what people do rather than who they are. Here is
everything that changed:

- **Your team now owns the whole reading product.** This includes the pipeline,
  hosting and the data the page reads, as well as the interface. The plan is in
  `apps/web/STATEMENT-OF-WORK.md`, and its sprint one replaces epic A as your
  first sprint. Where this page and the statement of work disagree, the
  statement of work wins.
- **Your first task is different.** The oldest version of this page said to
  make `t0` look right and finish two stubs. If you started on that, or on epic
  A, bring what you have. It is not wasted, and the table under "Sprint one" in
  `apps/web/BACKLOG.md` says where each earlier story went.
- **The month-by-month plan is gone.** The backlog replaces it. The map is in
  sprint one (story M1), and you can register a Mapbox token as soon as you
  start it.
- **The "family lines" idea is gone.** The old page taught `lineageId` and
  `independentLineageCount`. Both have been removed. Support is now counted as
  independent records that other people bring, and agreement never counts.
- **"Element" is now "detail"**, and a claim's `recordId` is now a source record
  plus optional evidence records. Both are explained under "Terms" below.
- **Meetings.** The old page said your instructor sets meetings. Your
  instructor has since set up a specification meeting every two weeks between
  your product owner and the sponsor, described under "How we work".
- **You no longer check the changelog every Monday.** A workflow in your fork
  does it and opens an issue. See "Turn on the upstream watch".
- **Badges are out for this semester.** The old page left contributor
  milestones open as a late option. They are cut, along with any dashboard
  built on a score.

If something you built or planned depended on the old version, bring it to the
next meeting. That was a reasonable thing to have done, and sorting it out is
our job.

## What you're building

Somebody drags a map around and finds a place. They open it and read what people
know about that place: who was there, what happened, which parts two people
remember differently. Your layer is everything that person sees.

The hardest part is showing a record that is thin, contested, half translated
and still arriving, without any of that reading as failure.

In the repository, three things are yours:

- `apps/web`, the interface
- `apps/ui-api`, where your read API for the browser will live. It is empty
  today. The routes that exist so far are in `apps/web/src/app/api/sites/`
- `packages/read-model`, which every read goes through

Beyond the code, the pipeline, hosting and the landing page are yours too. See
`apps/web/STATEMENT-OF-WORK.md`.

## Terms: site, record, claim, detail, rendering, profile

- **Site.** A place somebody has designated as meaningful. Records and claims
  attach to a site. A site does not attach to them.
- **Record.** What somebody hands over. A recording, a video, a photograph, a
  scanned document, or typed text. Nothing in the graph argues with a record.
- **Claim.** Somebody's reading of a record. This is where disagreement lands.
  One record can produce several claims.
- **Detail.** One piece of what a claim asserts, such as a year, a name or a
  street. A dispute points at a detail, and the rest of the claim stands. An extension
  points at a detail too, or at the whole claim when it is about all of it.
- **Rendering.** A transcript or a translation. One person's version of a record
  or a claim, credited to them, with more than one allowed to exist.
- **Profile.** Who a contributor is to the software. This semester a profile is
  a guest id kept in browser storage, and there are no logins.

A record plays one of two parts, depending on where it is used:

- **Source record.** The record a conversation starts from. Think of it like the
  opening post of a thread. Every claim belongs to a conversation, so every
  claim has one.
- **Evidence record.** A record attached to a claim to back it up. Optional.

It is the same kind of record either way. A photograph can start one
conversation and be evidence in another. "Conversation" itself is a working
idea that may be dropped. The source record is what groups the claims read from
it, so build on that.

"Account" is not a term in this project. It used to mean a contribution in some
sentences and a login in others. If you find it standing for either, that is a
leftover and worth a pull request.

If your fork still shows `claimElement`, or a `recordId` on a claim, it is on
contract version 1.0.0. Pull upstream to get 2.0.0 (see `docs/GIT.md`).

## What to ignore

Everything in this list belongs to the other layers, and nothing you build
depends on it.

- `apps/capture-api`, `apps/capture-web`, which is how contributions arrive
- `apps/graph-api`, the scoring and claim graph work
- `packages/fixtures/scoring/`, scoring rules for a different layer
- The object storage and ffmpeg sections of `SETUP.md`

## What to install first

| What | Version | Where |
|---|---|---|
| **Node** | 22.10 or later | [nodejs.org](https://nodejs.org), or [nvm](https://github.com/nvm-sh/nvm) if you juggle versions |
| **pnpm** | 9 | `npm install -g pnpm@9`, or `corepack enable` |
| **Docker Desktop** | current | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | current | Usually installed already |
| **VS Code** | current | [code.visualstudio.com](https://code.visualstudio.com) |

Check each before moving on:

```bash
node -v        # must be 22.10 or higher
pnpm -v        # must start with 9
docker ps      # must print a table, not an error
```

Node has to actually be 22.10 or later, and an older one fails with errors that
never mention Node. Docker has to be running. Installing it is not enough. `docker ps`
printing a table is the test.

**On Windows**, work inside WSL2 rather than PowerShell, with the repository in
the Linux filesystem. Crossing between the two is slow and causes line ending
problems that look like real bugs.

**Mapbox** needs a free token once you start on the map (story M1). `SETUP.md`
covers registering. Each person uses their own token and nobody commits one.
Without a token the map area shows a list of the same places instead. That list
is also how the map reaches somebody using a screen reader, so a list view ships
alongside the map either way (story M1).

## Getting the code

**One fork for the whole team.**

1. **Create a GitHub organisation for the team** to hold the fork. If the
   repository lives in one person's GitHub account and that person drops the
   class, the team loses it, and your instructor needs access for grading.
2. **One person forks `Civum/sagas` into it.** Once.
3. **Everyone clones that fork**, including whoever created it.

```bash
git clone https://github.com/YOUR-ORG/sagas.git
cd sagas
git remote add upstream https://github.com/Civum/sagas.git
```

Work on branches, open pull requests into your fork's `main`, and review each
other's. `docs/GIT.md` has the rest.

## Turn on the upstream watch

When the shared design changes, a workflow in your fork opens an issue saying
so, with the changelog in it. Nothing in your fork changes by itself. You decide
whether to pull the change, usually at the next specification meeting.

It does not run until you switch it on, in two steps, once:

1. **Enable Actions on the fork.** GitHub turns them off on a new fork. Open the
   **Actions** tab and confirm you want workflows to run.
2. **Enable the scheduled workflow.** GitHub's documentation says scheduled
   workflows on a fork are disabled by default. In the Actions tab, pick
   **Upstream contract watch** in the left sidebar and click **Enable workflow**.

The workflow reports by opening an issue, so Issues also have to be turned on
for the fork (in the fork's **Settings**, under **Features**).

After that it runs every Monday morning. You can also run it by hand with the
**Run workflow** button. The details are in `docs/GIT.md`, under "Finding out
that upstream moved".

## Where a change goes: your fork or upstream

This is a monorepo, meaning several apps and packages in one repository. Some of
what is in it is only yours, and some is shared by all three layers: the
contract that says what a claim or a record looks like (`packages/contracts`)
and the fixture data everyone builds against (`packages/fixtures`).

So there are two kinds of change. A change to your app goes into your fork. A
change to the shared contract or fixtures goes upstream as a pull request, and
gets talked about first. When the shared part changes upstream, every team is
told through the watch above, and each decides when to pull it.

## Get it running

```bash
pnpm install
pnpm dev:web
```

Two routes exist:

- `/` — a map and one article, wired end to end and looking like nothing.
- `/dev` — the same components rendered against all four fixture states, with
  the acceptance criteria for each state listed underneath.

A component that looks right against `t3` and falls apart against `t0` is the
normal failure, and `t0` is the state most real places stay in for a long time.

## Read these, in this order

1. **`docs/HOW-THE-LAYERS-FIT.md`.** One photograph followed through all three
   layers. Ten minutes, and it makes the rest make sense.
2. **`packages/fixtures/README.md`, the section "What your interface has to
   handle".** Situations a real archive spends its life in, and what your
   interface must not do about each. This is the closest thing to a
   specification you will get.
3. **`apps/web/STATEMENT-OF-WORK.md`**, then **`apps/web/BACKLOG.md`**, then
   **`apps/web/DIRECTION.md`.** The plan, the work, and where it is heading.
   `apps/web/PAGE-MODEL.md` and `apps/web/DEFINITIONS.md` sit beside them.
4. **`packages/contracts/src/model.ts`.** The shapes you render. The media and
   processing fields on a record belong to another layer and you can skim them.
5. **`docs/DESIGN-QUESTIONS.md`.** What is unsettled. Four questions matter to
   this layer before you design anything: "What does an interface do with
   'sometime in the fifties, probably'?", "Silence is not doubt", "What should a
   disagreement look like to the people in it?", and "Maria the subject and
   Maria the profile."

## How we work

**Every two weeks, a specification meeting.** Your instructor has set up
contact between your product owner and the sponsor every two weeks, and this is
what that meeting is for. Your product owner is the team member who speaks for
the team and decides the order of work. Anyone
else on the team is welcome. We go through what got done, describe the next
work, and load the backlog for the next two weeks. The product owner speaks for
the team's capacity: what fits, what does not, and what order it goes in. Your
instructor sets any other meetings the course requires. This layer's schedule
is different from the one in `docs/WORKING-TOGETHER.md`, which describes the
other two layers.

The two weeks between specification meetings are a **sprint**.

**The backlog lives in `apps/web/BACKLOG.md`.** Work is grouped into epics.
Each epic starts with a few stories, and more get added at each specification
meeting as the earlier ones land. You will not see the whole semester's work
written out on day one, and that is on purpose. Whether you copy the stories
into GitHub issues in your fork is your team's call. Each story is written so it
pastes straight into one.

**Progress comes in batches.** Between meetings, the sponsor is not watching
your fork. Before each specification meeting, send a short note using
`docs/CHECK-IN-TEMPLATE.md`. The most useful part is what you assumed, because
that is how we find out a specification was unclear before two weeks were built
on top of it.

**Small pull requests, opened early as drafts.**

**Questions** go in one standing issue in your fork, titled "Questions for the
sponsor", answered at least weekly. Anything urgent goes by email, through your
product owner, with a reply within a working day.

## Your first sprint

Your first sprint is "Sprint one" in `apps/web/BACKLOG.md`: two or three
issues for each of five workstreams, set out in `apps/web/STATEMENT-OF-WORK.md`.

## What is in this layer, in priority order

**First. This is what the semester is about.**

- **The narrative page.** What people have said about a place, readable as
  something a person can actually read, with the disagreements left in.
- **Confidence shown inline.** How well supported something is, without turning
  the page into a dashboard. Somebody glancing at a paragraph should be able to
  tell which parts have independent support and which rest on one person.
- **The map, and the list that stands in for it.** Finding a place at all.
- **The read model and the schema under it.** This is the job that gets
  forgotten, so somebody on the team should own it from the start.

**Next.**

- **Disputes shown on the page.** Two readings, both visible, with their
  support, and never shown as a vote tally.
- **Source and evidence attribution.** Every claim reaches the person it came
  from and the records it rests on. Attribution is never optional.
- **Version history.** What changed between two states and which contributions
  caused it. Every state carries `eventIdsSincePrevious`, so this is a real
  answer rather than one you reconstruct.

**Later, once the above work.**

- **Passover.** `sounds_right`, `dont_know` and `dont_care` on a claim, light
  enough that people actually use it. None of them is a vote, and a pile of
  `dont_know` must never read as a claim being rejected.
- **Heritage trails.** A sequence of sites telling one story. This is a concept,
  not a task yet. It becomes work once it is defined, and it will be defined
  with you.
- **Citation and export.** Stable links to one claim, and formatted citations.

**Not this semester.** Badges, and any dashboard built on a score. There is no
score to build one on, and the section after next says why.

## The design problems that run through the semester

The priority list above is the order of work. Separately, three design problems
cut across it, and none of them is fully designed yet. `apps/web/DIRECTION.md`
says what is decided about each, what the first steps are, and what is open:

- **The narrative page.** How the claims at a site become a page a person can
  read.
- **The suggestion interface.** How a reader is pointed at what to read next and
  what they could add. Passover feeds this.
- **References.** How the page shows what each claim rests on (its source and
  evidence records and its renderings), and how somebody links to one claim.
  This is about display. It is not an edge type in the graph.

## There is no score to show

Scoring belongs to the intelligence layer. It will decide what gets surfaced,
how the page is ordered, and what somebody is suggested to look at. It is never
a number shown to a person.

`contributorStanding` holds counts: records submitted, claims written, disputes
raised, translations and transcripts contributed. A view of somebody's own
contributions built on those counts is fine. Ranking people by them, sorting
them into tiers, or putting one number beside what somebody said about their own
family is not.

The most important idea in the finished `ConfidenceIndicator` is that
agreement is not corroboration. Five people saying "sounds right" is not five
independent records. This project treats presenting a count of agreement as
support as wrong, and it is an easy mistake to make by accident.

## The database

Every read goes through `packages/read-model`. Today it reads fixture JSON off
disk. Putting Postgres behind it is real work for whoever on the team takes the
back end: the schema, the queries, and the spatial index. Story Da1 is where it
starts. Your schema is shaped for drawing a map and a page, and it is not meant
to match the other layers' schemas.

```bash
cp .env.example .env      # then uncomment the sagas_read line

cd apps/ui-api
pnpm db:up && pnpm db:verify
```

That starts your layer's Postgres with PostGIS enabled, on port 5435. The other
two layers use 5433 and 5434, and nothing you start touches theirs.

`packages/read-model/README.md` lists three things that will bite. Coordinate
order is `[longitude, latitude]`, and getting it backwards produces an error at
the map, far from where the pair was swapped. `listSites()` has to take a bounding box once the
map has many places. And the obvious `getSiteState()` runs one query per claim.
Read `docs/GIS.md` before writing the map query.

## One thing not to do

Do not make `apps/web` fetch from `apps/ui-api` in server components. That adds
a network hop and a new way to fail and gains nothing. Server components import
`@sagas/read-model` directly. The API is for the browser.

## Deploying it

This is yours to own. `.github/workflows/ci.yml` already runs typecheck, lint
and tests on every pull request. Build on it, and add a deploy on merge. The
landing page runs on Cloudflare Workers, on the free plan. Where the full app
runs is a later proposal from the platform workstream, with what it costs, and
the sponsor signs up for whatever is approved. A preview for
each pull request comes later, by proposal. See `apps/web/STATEMENT-OF-WORK.md`,
and `apps/web/README.md` for more.

## Editor

Open the folder in VS Code and accept the recommended extensions. Formatting and
lint fixing on save are already configured. Use the repository's TypeScript
rather than the bundled one when it asks.

## What you get from the sponsor

- A specification meeting every two weeks, and a reply to email within a
  working day.
- Pull request review, done personally.
- Credit by name for anything merged upstream. Your fork is yours regardless.

This is an open source project, so it is never finished and you are not expected
to finish it. Build a small thing that works rather than a large thing that
nearly does.
