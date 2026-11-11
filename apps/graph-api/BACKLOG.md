# Intelligence layer backlog

The work for the scorer, in order. Each story says what it's for and how you'll
know it's done, and nearly every "done when" is a group of rules in
`packages/fixtures/scoring/rules.ts` passing. I'll add stories on Thursdays.

**How to read a story.** Each `###` heading is one story. If you track work in
GitHub issues, you can paste a story into one as it is. **Goal** says what
it's for, **Done when** is what we check, **Not in this story** says what to
leave out, and **Status** says **Ready** or **Later**. Later only means it's
further down the order I'd suggest, so you can split up and take any of them. S1
is optional, and S5 is the exception because I've built it.

## How to share work and get help

- Push a branch for each story, and open a pull request
  in your fork early. Unfinished is fine. I'd rather see
  something half done early than something finished late.
- Mention me on the pull request (`@7ujh6`). I'll answer within a day.
- If you're stuck for more than a day, tell me then.

## What the scorer is

The scorer measures. It never decides what's true, and it never decides what
gets published. Everyone can publish. The scorer describes how well supported
each detail is and shows where people disagree, and a claim with little in it
just scores low. Please call what it produces a "score".
"Authenticity" isn't a word this project uses, because nothing here can prove
a claim is authentic.

Support comes from the graph: the records behind a claim, who handed them
over, whether they're independent of each other, and the disputes and
extensions people attached. The people who write claims choose what each one
points at, so each reply already carries its edge. Read those before you reach for the
text.

## What a detail and a reference are

A detail is an excerpt of a claim that another claim points at. Nobody lists a
claim's details in advance. When a reply points at "opened in 1948", those words are
a detail of the claim it replies to, and `detailsOf(graph, claimId)` in
`@sagas/fixtures/scoring` works them out. A claim nothing points at has no details,
so it has nothing for the scorer to check across threads yet.

Every claim has a `target`: the claim or record it points into, and `details`, where it
points inside that, with none meaning all of it. Every claim has a
`relation`, dispute or extension, and its target and relation are its edge: the link one claim draws to
another. `A.target.details` says where A points, and
`detailsOf(graph, "A")` says what others point at in A. A claim also has `references`, which are typed links inside its own
text, like a date or a place. The contributor adds them, or the system suggests them
and the contributor confirms. How they get added is still open, and nothing scores
them yet.

Your scorer doesn't weigh the claim's text. Repeating a word or padding the text adds
nothing.

`similarity` compares a detail's excerpt with what a claim in another thread says,
to find the same thing said independently. The weight comes from the records behind
the match, and the match itself adds nothing.

## Where things are

| What | Where |
|---|---|
| Your scorer | `apps/graph-api/src/scorer.ts` |
| The rules it runs against | `packages/fixtures/scoring/rules.ts`, run by `apps/graph-api/src/scorer.test.ts` |
| The shape of the graph | `packages/fixtures/scoring/graph.ts` |
| A builder for test graphs | `packages/fixtures/scoring/build.ts`, and `build.test.ts` beside it shows how to use it |
| A worked example of walking the graph | `apps/graph-api/src/walk.ts` |
| Example places, as event logs | `packages/fixtures/fixtures/` (`docs/HOW-THE-LAYERS-FIT.md` walks through the corner shop) |
| Whole graphs as JSON | `apps/graph-api/example-graph.json`, `cat-graph.json`, `cases-graph.json` (the newer cases: one dispute with two changes, a whole-claim dispute, the same words twice, and a disputed transcript) and `corner-shop-graph.json` |
| A page for seeing a graph, with scores once your scorer returns them | `pnpm --filter @sagas/graph-api graph:view`, written up in `apps/graph-api/src/graph-view.ts` |
| The guide, with the list of what's fixed for every scorer | `docs/PHASE-2-INTELLIGENCE-LAYER.md` |

`packages` is the shared space every team pulls from, and `fixtures` is the
test data everyone uses. To experiment with your own data or model, copy what
you need into `apps/graph-api` and point your code at the copy.

## What the scorer does this semester, and where each part stands

By the end of the semester, your layer does the eight things below. They pick up from the first
milestone in the guide, and S1 to S9 stay as they were. At Monday's meeting we'll decide who
takes what, and I'll take some too.

| # | What the scorer does | Stories | Where it stands |
|---|---|---|---|
| 1 | Stores claims and takes them in, with a plain screen for writing them | S10, S11 | Not started |
| 2 | Scores from the graph | S2 to S8 | Your starter scorer, `Scorer-2.6.ts` on the `Test-Scorer` branch (6 November), reads the current graph with `detailsOf`, `repliesTo` and `pointsAt`. Its next step is moving into `src/scorer.ts` (S2). I've built S5's counting, in pull request #1 on your fork, waiting on your review. |
| 3 | Returns results for claims and details | S2 ("what comes back") | Your starter scorer already returns both levels, with placeholder numbers. |
| 4 | Explains any score | S12 | Not started |
| 5 | Passes the rule groups | S2 to S8 | The guide's first milestone is the five rules under "what comes back" and the five under "similarity between details". Your starter scorer aims at those, and I haven't run it, so we'll see on Monday how many pass. |
| 6 | Runs on the examples and the first real place | S13 | The example graphs are in `apps/graph-api`, and the real place is `first-place-claims.json`, from 3 November. |
| 7 | Runs behind `POST /score` | S14 | The endpoint is in `src/index.ts` and answers 501 until the scorer returns results. |
| 8 | The experience layer can call it | S15 | The package already exports the scorer. |

Your design notes are in `docs/Pseudo_Code_Model.md`, and `Swarm.ts` on `Test-Scorer` has a first
go at counting repeats for less. S1 is optional. S9, suggesting references, is yours as well,
further down the order.

## What you've already done

This work counts toward the list above.

### Your design notes

**Status:** Done.

`docs/Pseudo_Code_Model.md` on your fork's `main` is your model of the scorer, including the
`Keyword` shape that S9 builds on.

### A first scorer

**Status:** Done. The starter scorer below replaced it.

Your first scorer, pushed to `Test-Scorer` on 3 November, set out the terms a score is made of:
evidence, passovers, corroboration, extensions and disputes.

### The starter scorer

**Status:** Done as a first version. It counts toward items 2, 3 and 5.

`packages/fixtures/scoring/Scorer-2.6.ts` on `Test-Scorer`, pushed on 6 November, reads the current
graph.
- Its `similarity` compares two texts by the longest common subsequence of their words, divided by
  the length of the shorter one.
- It walks the graph with `detailsOf`, `repliesTo` and `pointsAt`.
- It returns a result for every claim and every detail in the contract's shape: whether a detail
  is contested, the claims that point at it, and their evidence. The scores are placeholders for
  now.
- `Scorer.test.ts` runs every rule against it.

Its next step is S2, which moves it into `apps/graph-api/src/scorer.ts`.

### Counting repeats for less

**Status:** A first version. It counts toward the independence rules in item 5.

`Swarm.ts` on `Test-Scorer` counts a claim that repeats an earlier one within ten minutes as a
tenth.

### Keeping up with the contract

**Status:** Done.

You merged contracts 2.6.0 and 2.7.0 into your fork.

---

### S1 · Walk the corner shop graph

**Status:** Optional. This is Step 0 in the guide, so skip it if you don't
need it.

**Goal.** Read the graph by what points at what, starting from a worked example.

**Done when:**
- You build the corner shop as a scoring graph in a test file of your own,
  with the builder. Its event log is
  `packages/fixtures/fixtures/corner-shop/events.ts`, and the comment at the top
  says what each moment shows.
- You write a function, following the pattern in `apps/graph-api/src/walk.ts`,
  that walks the corner shop thread by thread and prints what points at each
  detail.
- A test checks that function on the corner shop, including the dispute about
  the year and the extension that adds to the owner.

**Not in this story.** Any scoring.

### S2 · Words never carry weight

**Status:** Ready

**Goal.** A scorer that can't be pushed up by repeating words.

**Done when** your starter scorer from `Test-Scorer` is in `apps/graph-api/src/scorer.ts`, where
`scorer.test.ts` runs the rules against it, and these two rules pass, along with the ten from the
first milestone (the five under "what comes back" and the five under "similarity between details"):
- "never raises a claim for repeating its own words";
- "adds nothing for extra words in the claim text".

**Not in this story.** Filtering. The scorer removes nothing for being low in
information.

### S3 · Targets

**Status:** Later

**Goal.** A dispute of one detail leaves the rest of the claim
alone.

**Done when** the rules under "targets" pass.

### S4 · Evidence and volume

**Status:** Later

**Goal.** One attached record counts for more than one agreement, and
evidence tends to outweigh a crowd.

**Done when** the rules under "evidence and volume" pass.

### S5 · Independence

**Status:** I've built this one as its own function that your scorer calls,
`apps/graph-api/src/independence.ts`, in a pull request to your fork. We'll
decide on it together. It does the counting: the same person, the same
source, identical copies, and the same thing said in another thread. Timing,
record kind and challenges to independence are still yours. For this semester
a match counts straight away, with nobody confirming it. That's a temporary
choice, and whether a person should confirm first is a question for next
semester. Proposing matches is S7.

**Goal.** Support counts once per independent source. Nobody corroborates
themselves, two claims read from one record are one source, and a copy counts
for far less than an independent branch.

**Done when** the rules under "independence" pass.

### S6 · Disputes

**Status:** Later

**Goal.** The scorer never reports a disputed detail as settled, and disputes
alone never sink a supported detail below one nobody supports.

**Done when** the rules under "disputes" pass.

### S7 · Matching across branches

**Status:** Later

**Goal.** The scorer notices when a claim in another thread says the same thing as a
detail, so independent support from that thread can count.

**Done when** the rules under "matching across branches" pass.

### S8 · The worked examples

**Status:** Later

**Goal.** Everything above, working together on one place.

**Done when** the rules under "worked example: four claims" and "worked example:
the cat" pass.

### S9 · Suggest the references in a claim's text

**Status:** Later

**Goal.** A reference is a date, a place, a person or a record named in a claim's own text.
It looks close to the `Keyword` object in your `docs/Pseudo_Code_Model.md`. Given a claim's text,
your code suggests the references it finds, so the person who wrote it can confirm them.

**Done when:**
- `findReferences(text)` in `apps/graph-api/src` returns a list in the contract's
  `claimReference` shape, each with its `kind`, its `excerpt` from `findExcerpt`, and
  `status: "suggested"`.
- Tests read as scenarios: given this text, these references. "It opened in 1948 on Mill Road"
  suggests the date "1948" and the place "Mill Road". The same words twice give two references,
  each at its own position. Text with nothing to find returns an empty list.

**Not in this story.** Scoring references, because nothing scores them yet. Reference objects,
where "A House" and "Alison's Ale House" are one thing, which are spring work. The screen where
someone confirms a suggestion.

### S10 · Store claims and take new ones in

**Status:** Ready

**Goal.** Your layer owns claims and the edges between them, so they live in your own
database. Start with the local one from `pnpm --filter @sagas/graph-api db:up`, and see "The database" in
`apps/graph-api/README.md` for how migrations work here. Until the layers talk to each
other, mock the records and passovers you need. Store claims in the shape the scorer reads,
`claimNode` from `@sagas/fixtures/scoring`, which is also the shape of the example graphs. Don't
write your own copy of it. The contract's full `claim` adds `siteId`, `sourceLanguage`,
`sourceType` and `awaitingTranslation`, and the scorer doesn't need those yet.

**Done when:**
- A migration creates your tables, and a script loads `corner-shop-graph.json` into them.
- An endpoint takes a new claim, checks it against `claimNode`, and stores it. If the
  claim fails the check, the endpoint answers 400 and says why.
- Your code can load one place's graph from the database, ready to hand to the scorer, and a test
  checks that the corner shop comes back the same as the JSON you loaded.

**Not in this story.** A screen (S11). Opening a record's file, which the scorer never does.

### S11 · A plain screen for writing claims

**Status:** Ready. It saves through S10's endpoint, so mock the endpoint until S10 lands.

**Goal.** Somebody can write a claim and point it at another claim or a record, so you can try
the scorer on graphs you make yourselves. It doesn't need to look good.

**Done when** the screen shows one place's claims, and you can pick what a new claim points at
and which words in it, choose dispute or extension, write the text and save it. A dispute also needs its reasoning,
and for each part it points at, the words in your own text that replace them. A saved claim is
there when you reload. Where the page lives is your choice. `src/graph-view.ts` writes a page
with no dependencies, if you want a pattern.

**Not in this story.** Styling, logins, or anyone outside your team using it.

### S12 · Explain any score

**Status:** Ready once the scorer returns results.

**Goal.** For any claim, someone can see which terms produced its score, and why. How you show
the why is your choice.

**Done when** you can do that for every claim in the corner shop, and a test checks one.

### S13 · Run on the examples and the first real place

**Status:** Ready once the scorer returns results.

**Goal.** The scorer works on every example graph, and on a real place.

**Done when** one command scores `corner-shop-graph.json`, `cat-graph.json`, `example-graph.json`
and `cases-graph.json` and prints the results, and the same command works on the first real place,
`first-place-claims.json`, the copy I sent on 3 November. That file holds real records, so keep
it in your `real-data` folder, which git ignores, and don't commit it or pass it on.

**Not in this story.** Changing a graph so that it scores better.

### S14 · Score live with `POST /score`

**Status:** Ready once the scorer returns results.

**Goal.** You or I can send a place's graph to your server and get the scores back, so we can
show it live. The endpoint already exists in `src/index.ts` and answers 501 until the scorer is
written.

**Done when** `POST /score` returns the scorer's results for each example graph, a test calls the
endpoint with the corner shop and checks the response, and `apps/graph-api/README.md` says how to
run it.

### S15 · The experience layer can call your scorer

**Status:** Later. It comes last, once the scorer returns results.

**Goal.** The experience layer uses scores to decide what its pages show first, so it needs to
call your scorer.

**Done when:**
- `@sagas/graph-api/scorer` exports the scorer (it already does), and its results use the
  contract's score types.
- `apps/graph-api/README.md` has a short section on how to call it, what comes back, and how your
  scorer works.
- You open a pull request to upstream, because that's where the experience layer pulls from.
