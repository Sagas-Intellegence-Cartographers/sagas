# apps/graph-api — the intelligence layer

This app is yours, and it ships empty on purpose.

This app takes everything the archive holds about a place and works out how
much support each claim has, what is contested, what is missing, and what the
narrative page should look like right now.

## What goes here, roughly

- Reading the graph for a place
- Scoring claims, and recomputing when something changes
- Geographic queries: what is near here, what is inside this boundary
- Finding gaps worth filling and turning them into prompts
- Working out whether two claims in different languages are about the same
  thing

## Building the scorer

`docs/PHASE-2-INTELLIGENCE-LAYER.md` is the guide for this phase: the rules
your scorer answers to, how to run them and the server, how to add an
endpoint, and the model. In short: `src/scorer.ts` is yours to write,
`src/scorer.test.ts` runs the rules from `@sagas/fixtures/scoring` against it,
and `src/index.ts` serves `POST /score`.

## What you are given to work with

The derived states carry more than claims. Before you design anything, load one
and look at what is in it, because the shape of your input decides what your
algorithm can possibly be good at.

- `claims` — each with its author, its source record and any evidence records, translations,
  disputes per detail, competing readings kept side by side,
  passover signals ("sounds right" is agreement), and a placeholder weight.
- `records` — what people actually handed over, with media, processing state,
  and where each one says it was made and how that location was determined.
- `transcripts` — what somebody wrote down from a recording, attributed, with
  more than one allowed per record.
- `flags` — reports, with reasoning, open and resolved together.
- `standings` — what every contributor has actually done, as counts.

That last one is yours. It records behaviour and judges none of it, and turning
it into something that means anything is the deliverable. Read the comment on
`contributorStanding` in `packages/contracts/src/model.ts` and then the entry in
`docs/DESIGN-QUESTIONS.md` called "How do you tell a good source from a bad
one?" before you write a line of scoring code.

If a signal you need is missing, that is a contract change rather than something
to work around. Raise it early, because everyone else is building on the same
shapes.

## Where to start

For the scorer, start with `docs/PHASE-2-INTELLIGENCE-LAYER.md`; you don't need
the database or Docker yet. When you do, from `apps/graph-api`, with Docker
running:

```bash
pnpm db:up && pnpm db:verify
```

Then read, in order:

1. `packages/contracts/src/model.ts` for the shapes.
2. `packages/fixtures/src/reduce.ts` for how a snapshot is calculated today, in
   memory, with no database at all. It recalculates everything from scratch every
   time, which is fine for the fixture data and useless at any real size.
3. `docs/DESIGN-QUESTIONS.md`, starting with "How do you tell a good source from
   a bad one?". That is your headline deliverable and everything else in that
   section is downstream of it.

## Seeing what your changes do

`pnpm fixtures:build` uses the invented stand-in in
`packages/fixtures/src/stand-in-score.ts`, not your scorer, so it shows how the
fixtures move rather than how your scorer scores. The stand-in returns scores in
the same shape your scorer does (`claimScore` in the contract), which is why the
experience layer can build against it now. To see your scorer, run its tests or
send a graph to `POST /score`.

To see what a stand-in score is made of:

```bash
pnpm inspect --site freight-depot cl-fd-office
```

That prints each claim's terms and each detail's score. A number on its own is
not evidence of anything. The terms next to it are where a score explains
itself.

## The database

Your schema and migrations live in this app, next to the code that uses them.
`apps/capture-api` is laid out the same way and is worth copying from: it has a
`migrations/` folder of numbered SQL files, a `scripts/migrate.ts` that runs
them in order inside a transaction, and a `src/db.ts` that holds the connection.

None of it is written yet, and that is on purpose. Designing how this data is
stored is a deliverable rather than something the scaffold should decide for
you. The types in `@sagas/contracts` describe the data. How it gets persisted,
indexed and queried is the work.

You will also find that the types in `@sagas/contracts` are wrong in at least
one interesting way. Finding out which one is part of this too.

What it needs to grow:

- A schema for places, records, contributions, and the people who made them
- Spatial indexing, so "everything within two kilometres of here" is fast. Read
  [`docs/GIS.md`](../../docs/GIS.md) first
- Migrations, so the schema can change without anyone losing data
- A seed script that loads the fixtures into a running database

```bash
pnpm db:up        # Postgres 16 with PostGIS, on port 5434
pnpm db:verify    # confirms it works and prints your connection string
pnpm db:psql      # a psql shell inside the container
```

`db:verify` tells you what to do if something is wrong instead of printing a
stack trace. See [SETUP.md](../../SETUP.md).

## Who owns what

This app is yours alone. `apps/capture-api` belongs to the content layer and
`apps/ui-api` to the experience layer. They are separate apps so that no two
teams edit the same files, and so each can be deployed on its own terms.

There are three databases, one per layer, and none of them reads another's tables. Yours
is the store for claims, edges, contributors and the graph derived from them,
and designing it is your deliverable. The content layer runs its own for what
people hand over: records, media, transcripts, translations, flags. The
experience layer runs a small Postgres seeded from the fixtures, shaped for map
queries and article pages, so the interface is built against a database rather
than a file.

This project keeps them apart because they are three different problems, and
because it means no team can be blocked by another team's migration. What has
to line up is the contract between them, never the tables.
