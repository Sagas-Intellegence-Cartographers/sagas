# Phase 2, foundation: intelligence layer

The project runs in four phases: design, foundation, refinement and
deployment. Phase 1, design, ended with the scoring design you handed in on 14
October. Phase 2, foundation, is building the first working version of the
scorer and the pieces under it, over roughly the next month to a month and a
half. This is its guide. The start
guide (`docs/START-INTELLIGENCE-LAYER.md`) is still the syllabus for the
semester. This one has the specifics: how to run what's here, how to add to
it, the model as it stands, and where it's going, pulled together from the
emails and check-ins so far. When this guide and an older email disagree, this
guide wins.

## What you're building

The scorer. It reads the graph for one place and gives every claim and every
detail a score, with the terms each score is made of (its ingredients,
explained under "What a score is").

**About the input.** The graph in `packages/fixtures/scoring/graph.ts` is the
input I expect your layer to have: what the rest of the system can give you
about a place. How it plugs into your scorer is yours to work out. You might
turn it into your own structures, keep your own tables, or work out extra
things from it before you score. The rules only fix what goes in and what
comes out. What happens in between is your design.

A few things are fixed for every scorer:

- claims and details, and the graph of what each claim targets, are the input;
- weight comes mostly from evidence and independent support. Agreement adds
  almost nothing and never counts as support, so a crowd can't outweigh one
  independent record;
- a disputed detail is never shown as settled;
- a claim never scores lower for being translated, or for where its
  contributor lives;
- nobody's contributions are used to train AI models.

Everything else is yours: whether a conversation becomes its own thing, how
similarity works, which behaviour counts and how much, the arithmetic of a
score, and how special words like dates and places get noticed. If something on
the fixed list looks wrong, say so in a meeting.

The first milestone is a thin frame: `similarity` working, and a first
`score` that runs on the example graph. In the rules, that's the three tests
under "what comes back" and the five under "similarity between details". The
rest can fail for now. The date is Wednesday 28 October. Expect
the first week to go mostly to getting set up and finding your way around,
which is normal for a first build.

### Step 0, optional: build the corner shop as a graph

If the model still feels abstract, building the corner shop as a scoring
graph is a quick way in. It isn't a deliverable, so skip it if you don't need
it. The corner shop is the worked example in
`docs/HOW-THE-LAYERS-FIT.md`, and its event log is
`packages/fixtures/fixtures/corner-shop/events.ts`. The comment at the top of
that file lists what each moment in it shows.

Write it with the builder in `packages/fixtures/scoring/build.ts`, in a test
file of your own. For each step you'll have to decide what the record is, who
handed it over, which claim was read from it, and what each claim points at.
A photograph that arrives with nothing claimed, the person who reads it, the
dispute about the year and the extension that adds to the owner are all in
there.

It's done when the graph builds and you can explain every line of it. Nothing
scores it yet. Keep it, because it's the first test case you'll have written
yourselves.

### Scoring is bigger than it looks

A first scorer is the tip of it. Underneath are a set of smaller problems,
and each one is real work. Here's the list as it stands, with what I'd expect
from this phase. It's a proposal, so tell me if it looks wrong. What comes
after this phase gets its own list when we get there.

| Subproblem | What it is | This phase |
|---|---|---|
| Similarity | Matching the same detail across branches | Complete |
| Terms | Splitting a score into named terms, content and behaviour | Complete |
| Independence | Same person, same source, copies | Complete |
| Swarm damping | Many similar claims landing together count close to once | Complete, simple version |
| Evidence extraction | What can be drawn from a record: its kind, its metadata, where it was made | Partial |
| Profile behaviour | What a track record is made of | Partial |
| Resolution | What a resolution points at, and what it does to the disagreement | Partial |
| Periods | How time divides activity at a place, and what that does to late disputes | Design only |
| Propagation | How support travels along the graph, and depth | Design only |
| Task architecture | Turning a challenge into a task someone can check | Later |
| Group mechanics | What groups do in scoring | Later |

You can split up from here and take subproblems. Tell me who has what, so I
know who to ask.

**Stretch goal: a small claims interface in React,** for submitting a claim
and seeing what your scorer makes of it. It's there for anyone who wants it
once their part of the foundation is working.

When something works, show it in a meeting. When something's ready for me to
look at, mention me on it (`@7ujh6` in an issue or pull request), because I
don't get notified about your fork otherwise. If you're stuck for more than a
day, tell me then rather than at the next meeting.

## Running it

None of this needs Docker or a database yet. You may add one later as you
need it, and if you're not sure when, ask me.

```bash
pnpm install
pnpm --filter @sagas/graph-api test
```

The rules are skipped until you delete the `.skip` in
`apps/graph-api/src/scorer.test.ts`. Do that once `similarity` exists. From
then on, every run ends with a focus summary that lists each area of the rules
as weak, moderate or solid, with how many rules run, how many are still open
and how many failed.

To run the server, from the repository root:

```bash
pnpm --filter @sagas/graph-api dev
```

Then, in a second terminal:

```bash
curl -X POST http://localhost:3002/score \
  -H 'content-type: application/json' \
  -d @apps/graph-api/example-graph.json
```

You'll get a 501 until the scorer exists. That's expected.

## How the server works

I chose Express so you could all get started without a decision in the way.
It's what the rest of this repository uses. Change it later if you'd rather.

`apps/graph-api/src/index.ts` is short, and worth reading top to bottom. Every
endpoint you write will have the same three steps:

1. **Check what came in.** `scoringGraph.safeParse(req.body)` checks the
   request against the shape in `packages/fixtures/scoring/graph.ts`. If it
   doesn't match, send back a 400 with the errors. Never trust a request body.
2. **Do the work.** Here that's one call, `scorer.score(...)`. Keep the real
   logic out of the endpoint and in its own module, so you can test it without
   a server.
3. **Send back the result.** 200 with the result, or a clear error.

## Adding an endpoint

Say you want to check two pieces of detail text against each other over HTTP:

```ts
app.post('/similarity', (req, res) => {
  const { a, b } = req.body ?? {};
  if (typeof a !== 'string' || typeof b !== 'string') {
    res.status(400).json({ error: 'send { "a": "...", "b": "..." }' });
    return;
  }
  res.json({ similarity: scorer.similarity(a, b) });
});
```

The same three steps, in the same order. For anything bigger than two
strings, describe the request with Zod the way `graph.ts` does, and use
`safeParse`. Then test it with curl before you build anything on top of it:

```bash
curl -X POST http://localhost:3002/similarity \
  -H 'content-type: application/json' \
  -d '{"a":"crossed the road","b":"crossed over the road"}'
```

A few habits that save time:

- `express.json()` has to be registered before your routes, or `req.body` is
  undefined and nothing tells you why.
- Return after sending a response, so the handler never tries to send a
  second one.
- If a request breaks the server, write a test for the scorer that reproduces
  it before you fix it.

## Working without the database

For the next few weeks, the graph arrives in the request. You don't need to
store anything to score it, so the scorer can be a plain function: graph in,
result out. That's the easiest kind of code to test, and every rule tests it
that way.

To make graphs for your own tests, use the builder the rules use:

```ts
import { graph } from '@sagas/fixtures/scoring';

const g = graph()
  .record('r1', { by: 'p1', kind: 'audio', transcribed: true })
  .claim('A', { by: 'p1', source: 'r1', details: { year: '1950', place: 'Mill Road' } })
  .build();
```

Read `packages/fixtures/scoring/build.ts` for the rest: disputes, extensions,
evidence, passovers.

## Adding tests

You're expected to add tests as you go. There are two kinds, and they live
in different places.

**Tests of your own code** go in your fork, next to the code they test, as
`apps/graph-api/src/*.test.ts`. Write one for each piece you build (your
similarity function, how you detect a copy, how you damp a swarm) and one for
every bug before you fix it. Use the builder to make the graphs. These are
yours, and nobody else needs to approve them.

**Rules every scorer should obey** belong in the shared rules,
`packages/fixtures/scoring/rules.ts`. When your work answers one of the
placeholders (`it.todo`), or turns up a rule that's missing, write it as a
real rule and open a pull request upstream with your reasoning. Keep to the
pattern that's there: compare one graph with another rather than pinning a
number, and say what prompted it, whether that's a design question, a
changelog entry or your own pull request. Each rule you add moves its area of
the focus summary toward solid.

## When to bring the database in

When the foundation needs it, and not before. That moves the schema work the
start guide first planned for October later. You need it when you need to
remember something between requests. Examples: keeping the
graph for a place so nobody has to send it each time, keeping scores over time
so you can see how they move, or keeping the history a profile's track record
is worked out from. Not before.

When you get there, the pieces are ready. Docker has to be running for this
part:

```bash
cp .env.example .env          # then uncomment the sagas_intelligence line
pnpm --filter @sagas/graph-api db:up
pnpm --filter @sagas/graph-api db:verify
```

That gives you an empty Postgres with PostGIS on port 5434. To connect from
code, copy the pattern in `apps/capture-api/src/db.ts`: add `pg` and `dotenv`
to your dependencies, load `.env`, and create one `Pool` for the whole app.
`apps/capture-api/scripts/migrate.ts` shows a simple way to run migrations.
The tables are yours to design.

## The model as it stands

A few words first. A **thread** is a source record and the claims built on
it, which earlier emails called a conversation. A **branch** is one line of claims inside it. An **edge** is a link one
claim draws to another: a dispute or an extension. A **passover** is the light
signal a reader leaves on a claim: "sounds right", "don't know" or "don't
care".

### Every claim targets something

The relationships between claims aren't hidden in the text. People state them
when they write a claim, and they become the edges of the graph:

- **A dispute is a claim that targets one detail of another claim,** like the
  year, and always gives a reason. It never targets a whole claim.
- **An extension is a claim that adds to another claim.** It usually targets
  a detail, or the whole claim when it's about all of it, and it replaces
  nothing.
- **Every claim names its source record,** the record it was read out of, and
  can attach other records as evidence.

So the scorer reads edges before it reads words. The shared contract and the
graph in `packages/fixtures/scoring` both store them this way.

### Details aren't keywords

A detail is a part of a claim someone can point at: a date, a place, a person,
an event, a quantity, an attribution. It exists so people can disagree about
the year without disagreeing about the building. Don't extract keywords from
claim text to stand in for details.

### Where text matching belongs

Inside one thread, matching is free, because every claim already names its
target. Across branches it isn't. If a claim from a different record says "a
cat ran across Mill Road in 1950", nothing links it to the first claim, and
the system has to notice it's about the same detail.

That's what `similarity` is for. Start with the longest common subsequence
over words: lowercase both, find the most words they share in the same order
(other words can sit in between), and divide by the length of the shorter
one. "crossed the
road" and "crossed over the road" score 1. It misses synonyms, and that's fine
for now.

A match is a suggestion that two details are the same. It never adds weight on
its own. What it can do is let independent support from another branch count.

### What a score is

- A score is a float, built from **terms**. Term means the maths sense here,
  not a word in the text: each term is one piece of the formula that adds up
  to a score. In `score = 2·evidence + 0.5·log(1 + agreements) − disputes`,
  each of the three pieces is a term. Your formula will look different.
- Terms come in two families: **content** (what the claim and its records
  carry) and **behaviour** (what the people involved have done). You name the
  terms and decide how they combine.
- The terms come from several places: the claim's details, its place in the
  graph, the evidence attached, independent support from other branches, and
  behaviour. Only some of that lives on details.
- No score is absolute. Any input can be outweighed by enough of the others.
- No one term should keep dominating the rest. If one does across lots of
  scores, this project treats that as a sign something's broken or being
  gamed. Returning the terms with each score is how you'll be able to
  tell.

### Evidence

A record attached as evidence carries a lot of score, because a lot can be
drawn from it:

- its kind: a photo, a scanned document, a recording or typed text;
- its metadata, such as the date and place a phone stores inside a photo when
  it's taken, which can show it was made near the site at the right time;
- who brought it, and whether that person is independent of the claim's
  author;
- for a recording, whether it has been transcribed, so what it says can be
  read;
- how many other claims rely on it.

This project expects evidence to outweigh a crowd of voices most of the time.
It isn't absolute, though: evidence can be misleading, irrelevant or incomplete, and
sometimes the popular reading is the right one.

A recording nobody has transcribed yet can't contribute anything that depends
on what it says. Which terms those are is yours to decide.

### Independence

This is the area to focus on. Agreement from the same origin isn't support:

- One person's claims never corroborate each other.
- Claims read out of the same record count as one source.
- A word-for-word copy from someone else adds close to nothing.
- Similar claims landing at nearly the same time are treated as having one
  origin. How short that window should be is part of your design.
- A photo or document counts for more than a typed paragraph, because this
  project treats it as harder to fake.
- Anyone can challenge whether two records are really independent, with a
  reason and evidence.
- Age adds nothing. An old claim with no records doesn't gain credibility for
  being old.

### Disputes

- A dispute lands on one detail and leaves the claim's other details alone.
- One dispute without evidence shouldn't knock over a detail that has
  independent support.
- A reason backed by a record can be checked. A reason about who someone is
  ("I lived next door") can't. How the system does the checking is still
  open.
- More disputes never raise a score, and disputes alone never sink a supported
  detail below one nobody has supported.

### Passovers

"Sounds right" adds very little weight: enough that claims with nothing else
going for them can still be put in an order, and well below every other
input. It's kept apart from evidence.

### People

The scorer reads what a profile has done, never who they are. A track record
and the groups someone has joined are behaviour. A name, a credential or a
family isn't. Most profiles are guests, and that's normal. Which behaviour
shows that someone knows a subject is one of your design questions. The
`profiles` block in the rules lists some ideas to test, and they're only
ideas.

### Two worked examples

Four claims about one place, from `apps/graph-api/example-graph.json`:

1. "The Hendersons' cat crossed Mill Road in 1950."
2. The same sentence from a second person minutes later, with nothing
   attached and no link to claim 1.
3. A claim disputing claim 1's year: "It was 1960. Mill Road wasn't built
   until 1958."
4. A claim extending claim 1 from someone else, with a photo attached.

Claim 4 should help claim 1 the most and claim 2 the least. Claim 3 should
leave the year contested and the rest of claim 1 alone. If weight came from
shared words, claim 2 would come out strongest.

The cat example, from the 7 October email, shows how claims, details and
disputes fit together, and claim F is the clearest picture of independence.

Start with a record. Record R is a recorded interview with a neighbour of the
site, and its transcript says: "There was a cat out front every morning."

- **Claim A** takes R as its source record and says "The cat crossed the
  road." Its details are the cat, crossed, and the road. Every claim after A
  targets one of these, or a detail in a claim built on A.
- **Claim B** is an extension. It targets "the cat" and adds "it was a
  calico". It adds a detail and replaces nothing.
- **Claim C** is an extension. It targets "crossed" and adds "to catch a
  bird".
- **Claim D** is a dispute. It targets "the road" and says "it was a fence".
  Its reason is "I lived next door".
- **Claim E** attaches a photo of the cat on the road. That record supports
  "the road", the detail D disputed.
- **Claim F** comes from a different source record, a 1962 newspaper note
  about the street. It doesn't descend from A, so nothing links them. It says
  "a cat ran across the road that morning".
- **Claim G** would be a resolution reconciling D and E: "It crossed the road,
  then jumped the fence." D stays in the archive. How a resolution is
  recorded is still open.

**Why F matters.** A, B, C, D and E all live in one thread, built on record R.
Agreement inside one thread all traces back to the same interview. F reaches
"the road" from a separate record, by a separate route. That's independent
support, and it's worth more than ten agreements inside A's thread. It's also
why `similarity` exists: nobody linked F to A, so the system has to notice
that "ran across the road" and "crossed the road" are the same detail. A
word-matching first version only sees "the road" in common and scores them
lower than it should. That's the known gap with synonyms, and it's fine for
now.

Where it ends up: "the road" is stable, with evidence from E and independent
support from F, and one new dispute shouldn't knock it over. "Calico" and "to
catch a bird" each come from a single claim, so they're still forming.
"Fence" has a reason and no record, so it carries less until someone brings
evidence.

## Where the model is going

### Decided, and in contract 2.4.0

- **Weight lives on details,** as well as on whole claims. Your result already
  scores each detail (`claimScore` is now the contract's own shape).
- **A claim can cite a time window of a recording,** and until that window has
  a transcript, the part of its score that comes from the claim itself waits.
  The graph carries `sourceWindow` on a claim and `transcribedWindows` on a
  record, and there's a rule for it.
- **Links are records.** A web page is evidence like any other record, weighed
  by independent people relying on it, never by its domain.

### Decided, and not in the contract yet

Build toward these.

- **Resolution is its own kind of edge,** beside dispute and extension: a
  claim that reconciles a disagreement, with weight like any other claim, and
  more than one allowed. What it points at is still open (below), so it isn't
  in your graph yet.
- **Evidence records, transcriptions and translations become one kind of
  supporting record,** scored by how they're used rather than by whether
  anyone vouches for them.

### Open questions for this phase

Each of these touches the scorer, and nobody has answered them. Your design is
a fair place to propose answers. The ones in `docs/DESIGN-QUESTIONS.md` are
named by their heading there.

- **"How do you tell a good source from a bad one?"** The headline question
  for your layer.
- **"How to tell silence from doubt."** What a pile of "don't know" should do.
- **"Does a late dispute count for less?"** Periods, and whether time changes
  a dispute's weight.
- **"How should a resolution be recorded?"** What a resolution points at, and
  what happens to the disagreement once one exists.
- **"How do claims compare across languages?"** Matching details that weren't
  written in the same language.
- **"What happens when one detail turns out to be two people?"**
- **Where evidence attaches:** to the whole claim, or to the detail it
  supports. Not in the design questions yet; there's a placeholder in the
  rules.
- **Which behaviour shows competence:** what a profile's track record should
  be made of. Also a placeholder in the rules, with ideas to test.
- **How passovers arrive.** Today they come in the graph with everything
  else. They're frequent and light, so they may fit better as a stream to
  their own endpoint that keeps running totals, with scoring reading the
  totals. More broadly: the whole graph in one request is a convenience for
  this phase, and a real system gets its data as things happen. How your layer
  takes in changes over time is a system design question for you.

## How we'll work during the build

- **Demo first.** Meetings start with a demo of what's new. Bring a
  short reason for each choice you made. AI is fine to use for anything, but
  the reasons need to be yours, and I'll ask.
- **Mention me when something's ready.** I don't watch your fork.
- **If a rule looks wrong, say so.** Open a pull request against
  `packages/fixtures/scoring/rules.ts` with your reasoning rather than
  editing it in your fork. Every team is held to the same rules.
- **The placeholders are questions.** The `it.todo` rules carry their context
  in a comment. Some of them nobody has answered, and your answers count.

## Some advice for a first build

Most of what goes wrong on a first project is the same handful of things.

- **Make it work, then make it good.** Get `similarity` passing with the
  simplest thing that works before you make it clever.
- **Run the tests constantly,** every few minutes. A failure you caused two
  minutes ago is easy to find.
- **Commit small.** One change per commit, with a message that says why. When
  something breaks, small commits tell you where.
- **Read the whole error.** The useful line is often the third one.
- **Write a test for every bug before you fix it.** Then it can't come back
  quietly.
- **Keep the scorer a plain function** for as long as you can. It's easier to
  test, easier to reason about, and the server stays thin.
- **Ask early.** An hour stuck is normal. A day stuck is a message to me.
