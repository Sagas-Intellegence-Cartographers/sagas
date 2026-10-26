# Start here — intelligence layer

This repository is bigger than your part of it. Most of what is here is not
yours and you can ignore it. This page is the short version.

**Treat this as the syllabus for the semester.** Read it through once, then come
back to it. You are not expected to hold it in your head.

**Phase 1, design, is over.** For phase 2, foundation, start with
`docs/PHASE-2-INTELLIGENCE-LAYER.md`: how to run your layer, how to add to it,
and the model as it stands and where it's going, in one place.

## What you're building

People contribute claims about places. Somebody says their great-grandmother
cooked in a boarding house from 1922, somebody else says the register shows
1914, and a third person adds that the building had a different name before the
war. Your layer is what decides how much any of that is worth, from what
people have done and never from who they are.

You own one app, which has a scorer stub, the rules it answers to, and one
working endpoint:

- `apps/graph-api`, the server, and later the schema and migrations behind it

## What the five core terms mean

- **Site.** A place somebody has designated as meaningful. Records and claims
  attach to a site. A site does not attach to them.
- **Record.** What somebody hands over. A recording, a video, a photograph, a
  scanned document, or typed text. Nothing in the graph argues with a record.
  Disagreement lands on claims instead.
- **Claim.** Somebody's reading of a record. This is where disagreement lands.
  One record can produce several claims.
- **Rendering.** A transcript or a translation. One person's version of a
  record or a claim, attributed, with more than one allowed to exist.
- **Profile.** Who a contributor is to the software. This semester a profile is
  a guest id kept in browser storage, and there are no logins.

"Account" is not a term in this project. It used to be, and it was doing two
jobs at once: a contribution in some sentences and a login in others. If you
find it still standing for either, that is a leftover and worth a pull request.

## What to ignore

These belong to other teams and nothing you build depends on them.

- `apps/web`, `apps/ui-api`, `packages/read-model`, the reading experience
- `apps/capture-api`, `apps/capture-web`, how contributions arrive
- Anything about uploads, media, transcoding, storage, or file processing
- The object storage and ffmpeg sections of `SETUP.md`

You do not need MinIO, ffmpeg, or a Mapbox token. The setup instructions mention
them because one document covers three teams.

## What to install first

You need fewer things than the other teams.

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

**Two things that cost an hour if you skip them.** Node has to actually be 22.10
or later, and an older one fails in ways that never mention Node. And Docker has
to be running. Installing it is not enough. `docker ps` printing a table is the test.

**On Windows**, work inside WSL2 rather than PowerShell, with the repository in
the Linux filesystem. Crossing the boundary is slow and causes line ending
problems that look like real bugs.

## Getting the code, before anyone clicks Fork

**One fork for the whole team.**

1. **Create a GitHub organisation for the team** to hold the fork. If the
   repository lives in one person's GitHub account and that person drops the
   class, the team loses everything, and your instructor needs access for grading.
2. **One person forks `Civum/sagas` into it, once.**
3. **Everyone clones that fork**, including whoever created it.

```bash
git clone https://github.com/YOUR-ORG/sagas.git
cd sagas
git remote add upstream https://github.com/Civum/sagas.git
```

Work on branches, open pull requests into your fork's main, review each other.
`docs/GIT.md` has the rest.

## Turn on the upstream watch

When the shared design changes, a workflow in your fork opens an issue saying
so, with the changelog in it. Nothing in your fork changes by itself. You decide
whether to pull the change, at a check-in.

It does not run until you switch it on, in three steps, once:

1. **Enable Actions on the fork.** GitHub turns them off on a new fork. Open the
   **Actions** tab and confirm you want workflows to run.
2. **Enable the scheduled workflow.** GitHub's documentation says scheduled
   workflows on a fork are disabled by default. In the Actions tab, pick
   **Upstream contract watch** in the left sidebar and click **Enable workflow**.
3. **Turn on Issues.** The watch reports by opening an issue, so Issues have to
   be on for the fork (the fork's **Settings**, under **Features**).

After that it runs every Monday morning. You can also run it by hand with the
**Run workflow** button. The details are in `docs/GIT.md`, under "Finding out
that upstream moved".

## Why one repository holds three teams

This is a monorepo: several apps and packages in one repository.

Some of what you build is specific to your layer and stays in your fork. Some of
it is shared with the other two layers: the contract that says what a claim or a
record looks like (`packages/contracts`), and the fixture data everyone builds
against (`packages/fixtures`). Keeping both in one place means that when the
shared design moves, every team gets the same update through the watch above.
When your own design moves, that stays with you.

`docs/HOW-THE-LAYERS-FIT.md` follows one photograph through all three layers.

## Get it running

```bash
pnpm install
pnpm --filter @sagas/graph-api test
pnpm inspect --site freight-depot cl-fd-office
```

That is the whole setup for now. The test command runs the scoring rules
against your scorer and prints a focus summary at the end. `pnpm inspect`
prints one claim from the fixtures with the named parts of its score.

## The database, when you need it

You won't need it in September. Your first month is the model and then the scorer, and the
scorer is arithmetic over numbers the fixtures already hold, so there is nothing
to store and nothing to query. The database work starts in October, when you
build the schema your diagram argued for.

It is ready whenever you want it:

```bash
cp .env.example .env      # then uncomment the sagas_intelligence line

cd apps/graph-api
pnpm db:up && pnpm db:verify
```

That starts your layer's Postgres container with PostGIS enabled and an empty
database called `sagas_intelligence`, on port 5434. `db:verify` prints the
connection string for your `.env`. The tables are absent on purpose, because
designing them is your work.

It belongs to your app, defined by a `docker-compose.yml` sitting next to it.
The other two layers have their own on their own ports, and nothing you start
here touches theirs.

**Worth running it once this week anyway**, even though you will not use it. If
Docker is going to give you trouble on your machine, finding that out now while
nothing depends on it is much better than finding out in October when it is
blocking you. Start it, see three ticks, stop it again, and forget about it
until you need it.

## Setting up VS Code

Open the folder in VS Code and say yes when it offers the recommended
extensions. Formatting and lint fixing on save are configured already, so
nobody's editor reformats a file somebody else wrote. Use the repository's
TypeScript rather than the bundled one when it prompts.

## Read these four, in this order

1. `packages/fixtures/scoring/rules.ts`. The rules any scorer
   has to obey, written as executable tests. It is the closest thing to a
   specification this project has.
2. `packages/contracts/src/model.ts`. Read all of it rather than only your
   part, because your first task is a diagram of the whole thing. The media and
   processing fields on a record belong to another team and you can skim those.

   `edgeType` has two values, dispute and extension.
3. `packages/fixtures/src/reduce.ts`, which calculates a snapshot in memory with
   no database at all. It recomputes everything from scratch every time, which
   is fine for the fixture data and useless at any real size. That gap is your
   work.
4. `docs/DESIGN-QUESTIONS.md`, starting with "How do you tell a good source from
   a bad one?" This project treats that as the main problem, and it opens Part 3,
   the questions that are open by design.

## The plan, month by month

**September, the model and then the rules.** Get the stack running, read the
model, and bring your own entity relationship diagram and the reasoning behind
it to a check-in. The week after that, write a scorer that
answers to the rules in `packages/fixtures/scoring`. No database work yet.

**Mid October to roughly late November, foundation.** The first working scorer and the
problems under it, against the rules in `packages/fixtures/scoring`.
`docs/PHASE-2-INTELLIGENCE-LAYER.md` is the guide.

**When the foundation needs it, the schema.** Design the tables for claims, details, edges
and contributors, write the migrations, and move the graph out of memory and
into Postgres. Spatial indexing lives here too.

**November onward, propagation.** How weight actually moves through the graph,
and whichever of the open questions you decide to take on.

Contract 2.1.0 adds sections to a site's page, and producing them is also your
work, after the scoring design. A section has a heading and a passage, with
phrases that lead back to the claims behind them. Which claims belong together, what a heading says and how a
passage is written are yours to work out. The fixtures carry invented sections
for the corner shop in the meantime, and the open parts are in
`docs/DESIGN-QUESTIONS.md` under "What groups claims together at a site?".

Scoring is the bounded half of your layer. The other half is routing: working
out which claim to put in front of which person, and why. That is spring work.
This project does not have an answer for it, and it will need signals the
contract does not record yet, such as what somebody tends to contribute and
where they keep coming back to. Asking for those is expected rather than a sign
something went wrong.

## Your first task, and it is not code

Come back with an entity relationship diagram of the model as you think it
should be after reading it, rather than as the repository has it.

This repository is a foundation with gaps in it. Some of what is here is wrong
and some things are missing entirely. Finding them is the assignment.

Here are three gaps I know about. Where one has been decided, it says so.

**Records and claims.** Your main focus is claims. How much your layer reads the
records behind them is still being worked out. A record plays one
of two parts. As a *source record* it is where a conversation starts, and every
claim in that conversation has it as `claim.sourceRecordId`. As an *evidence
record* it is attached to a claim to back it up, through
`claim.evidenceRecordIds`, which is optional. The same record can do both in
different conversations. Whether "conversation" becomes a named object is
now in doubt. The argument against it is that the source record already groups
the claims read from it. It is not decided, so build on the source record and
bring anything that argues either way.

**Whether a record carries a score.** Decided: a record's score is a citation
count, how many claims lean on it. It is kept separate from claim weight, because
if a record's score fed back into the claims that cite it, the loop would reward
itself. You do not rank records beyond that.

**Independence**, which is the one I would most like the diagram to have an
opinion about. Corroboration counts independent records. It never counts people. The
contract has a stand-in, `independentRecordCount`: the number of distinct records other contributors have
brought to back a claim. Agreement never counts.

The stand-in cannot tell when two records share a source. Two cousins who heard
one telling and each wrote it down look like two sources. Working out
independence from the graph (the same record cited twice, the same branch,
descent from the same root claim) is yours.

This project treats the edges as the strong signals. An extension pushes a claim up, a dispute
pushes it down, and a resolution would lift both branches it reconciles, so a
claim's weight moves in both directions over time. Passovers (`sounds_right`,
`dont_know`, `dont_care`) are soft signals, and they matter most for routing:
what gets suggested to whom.

There are more gaps than those three. Bring the diagram and the reasoning. Where
you diverge from what is in the repository, say why.

**Bring the revised diagram to your next check-in.**

## Your next task: the scorer

`apps/graph-api/src/scorer.ts` holds an empty scorer, and
`apps/graph-api/src/scorer.test.ts` runs the rules in
`packages/fixtures/scoring/rules.ts` against it. The rules are skipped until
you delete the `.skip` in the test file.

```bash
pnpm --filter @sagas/graph-api test
```

The scorer reads the graph for one place and returns a score for every claim
and every detail, each with the terms it's made of. A claim's score is a
composite: its details, its place in the graph, the evidence it carries,
independent support from other branches, and behaviour. How those combine is
yours.

Every rule compares one graph with another, and none pins a number. Some are
placeholders with their context written above them. The focus summary at the
end of each run shows which areas are thin. Start with `similarity`, then
independence, which is the area I've named as the focus.

`apps/graph-api/src/index.ts` already serves `POST /score`, so you can run your
scorer over HTTP from the start. `docs/PHASE-2-INTELLIGENCE-LAYER.md` has the
commands and the model.

## What the scorer reads about people

The scorer reads what a profile has done, never who they are. A profile's
track record and the groups it has joined are behaviour, and behaviour can be
scored. A name, a credential or a family can't. Which behaviour shows that
someone knows a subject is one of your design questions, and the `profiles`
block in the rules has ideas to test.

## What to check every Monday

Check `CHANGELOG.md`. Anything that changed is listed there with a line saying
which team it affects. If it does not say intelligence layer, skip it. Your fork
never updates itself, so nothing changes underneath you.

## Choosing a server framework

I chose Express 5 for `apps/graph-api` so you could all get started easily.
It's what the rest of this repository uses, and it has one working endpoint
already. You can change it down the line if you'd rather; write down why if
you do.

## How we work

- **Check-in, 30 minutes.** Weekly for the first month, then every other week.
- **Office hours, 30 minutes before it.** Runs only if there is something to
  discuss, so most weeks it will not.
- **A short note before each check-in**, template in
  `docs/CHECK-IN-TEMPLATE.md`. The most useful part is what you *assumed*.
- **Small pull requests, opened as drafts early.** I would rather see the shape
  at twenty percent and say not that direction than read eight hundred lines and
  ask you to start over.
- **Between meetings**, expect a reply within a working day rather than the same
  evening.

## What you get from me

- Pull request review, personally, every week
- Anything merged upstream is credited to you by name. Your fork is yours
  regardless, and what you write in it stays yours.

## You are not expected to finish it

This is an open source project, and you are not expected to finish it.

The questions in Part 3 of `docs/DESIGN-QUESTIONS.md` are where the work is.
Open there means I do not have an answer. I have not looked into whether anyone
else does, and your faculty advisor would know more about that than I do.

Build a small thing that works rather than a large thing that nearly does.
