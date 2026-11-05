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
| Whole graphs as JSON | `apps/graph-api/example-graph.json`, `cat-graph.json` and `corner-shop-graph.json` |
| A page for seeing a graph, with scores once your scorer returns them | `pnpm --filter @sagas/graph-api graph:view`, written up in `apps/graph-api/src/graph-view.ts` |
| The guide, with the list of what's fixed for every scorer | `docs/PHASE-2-INTELLIGENCE-LAYER.md` |

`packages` is the shared space every team pulls from, and `fixtures` is the
test data everyone uses. To experiment with your own data or model, copy what
you need into `apps/graph-api` and point your code at the copy.

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

**Done when** these two rules pass, along with the ten from the first milestone
(the five under "what comes back" and the five under "similarity between details"):
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
