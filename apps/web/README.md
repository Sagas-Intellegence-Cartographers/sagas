# apps/web — the experience layer

This is yours. It ships close to empty on purpose.

The component library, the map, the narrative page, the suggestion interface
and references are your scope, in the order `apps/web/BACKLOG.md` sets.
Heritage trails come later. Contributor milestones and any dashboard built on a
score are cut this semester. There are no design tokens and no component
library in here, because building them is the work.

Worth knowing: `IntegrityBadge` is about a *place*, and how well documented it
is. Contributor progression, which an earlier scope document called "badges",
is a different thing, and this repository calls it "milestones" so that one
word does not mean both.

What you get instead: a working Next + TypeScript + Tailwind setup, the fixture
data, a place for every read to go through, and a list of situations your
interface has to survive.

## Run it

```bash
pnpm install
cp .env.example .env      # add your own Mapbox token, or don't. See below.
pnpm dev:web
```

Two routes exist:

- `/` — a map and one article, wired end to end and looking like nothing.
- `/dev` — the same components rendered against all four fixture states, with
  the acceptance criteria for each state listed underneath.

Use `/dev` while you build. A component that looks right against `t3` and falls
apart against `t0` is the normal failure, and `t0` is the state most real places
sit in for a long time.

**You do not need a Mapbox token to work on this.** With no token, the map area
renders a list of the same places instead. That list is also how the map's
information reaches someone using a screen reader, so it ships either way and
it needs to be good. See `src/features/map/MapUnavailable.tsx`.

## Where the data comes from

Every read goes through `@sagas/read-model` (`packages/read-model`). `src/lib/queries.ts` re-exports it so older imports keep working:

```ts
import { getSiteState, listSites } from '@/lib/queries';

const sites = listSites();                        // every place, for the map
const state = getSiteState(sites[0].slug, 't3');  // 't0' | 't1' | 't2' | 't3'
```

Today those functions read fixture JSON off disk.

**Your first infrastructure job is to put a database behind them.** Run Postgres
locally, design a schema for reading, seed the fixture states into it, and make
`packages/read-model` query it instead. That is real work and it belongs to whoever holds
the back end and database roles: schema design, spatial indexing so "everything
within 2km of here" is fast enough to drive a map, and working out what is held
in memory versus fetched per request.

Do it early. `packages/read-model/README.md` says why.

It stays local. Nothing here talks to a server anyone else runs, and nothing
deploys until you decide to.

`src/app/api/sites/` holds HTTP routes over the same functions. That is your read
API and it is the seam a client-side map fetches through. Server components can
call `queries.ts` directly and mostly should.

There is no synthesis API this semester. The intelligence layer builds that
later, and a derived graph state is enough for every view in your scope. If you
find yourself wanting to fetch narrative state from a service that does not
exist, stop and bring it to a check-in. It means the contract is missing
something, which is worth knowing early.

## How the files are organised

```
src/app/          routes. Pages read data and hand it down.
src/features/     components that know what Sagas is.
src/components/ui/ generic pieces. Nothing in here knows what Sagas is.
src/lib/          data access and helpers.
```

Two rules hold this together:

**Components take props. They do not fetch.** A page or route handler calls
`queries.ts` and passes the result down. This is what lets the same components
render against four different states on `/dev`.

**`components/ui` stays generic.** A button, a dialog, a tooltip. If a file in
there imports from `@sagas/contracts`, it belongs in `features` instead. This is
the shadcn convention, and this project expects you to keep it, because it is
what keeps the component library reusable beyond one page.

## Start here: one worked example, then the stubs

**Three components and one page are finished.** They go from data to rendered
pixels and are commented as examples rather than specifications.
`IntegrityBadge` and `ConfidenceIndicator` have tests.

- `src/app/page.tsx` — how data gets from `@sagas/read-model` to the screen
- `src/features/site/IntegrityBadge.tsx` — and its test
- `src/features/article/ConfidenceIndicator.tsx` — and its test
- `src/features/map/MapUnavailable.tsx`

**Everything else under `src/features` is one line and a TODO.** Each carries a
comment saying what it has to become and what is easy to get wrong, and several
name the acceptance criterion they are worried about.

Read the finished ones. `apps/web/BACKLOG.md` has the work that comes next.

Two things to copy from the examples, and one not to.

**Copy the split.** The judgment lives in a pure function, `bandFor` or
`supportSummary`, separate from the markup, so it can be tested without
rendering anything. A test that a div has a class fails every time somebody
improves the design. A test that a sparse record is never described as failing
is worth keeping.

**Copy the data flow.** The page reads, components take props. That is what lets
the same components render against four fixture states on `/dev`.

**Do not copy the styling.** Grey text and system fonts are a placeholder. The
design system is your deliverable, and nothing in there is a suggestion.

The idea this project cares most about is in `ConfidenceIndicator`: agreement
is not corroboration. A claim can have five people agreeing and no
independent support, because agreeing does not bring a record.

## When something is behaving strangely

[`docs/DEBUGGING.md`](../../docs/DEBUGGING.md) covers the failures that do not
announce themselves: Turbo replaying a cached pass, an environment variable that
needs a restart, `params` being a Promise in Next 15, and the server-versus-client
component error that confuses everyone once.

## Before you call a view done

Read `packages/fixtures/README.md` for what the four graph states are and what
each one is designed to break.

Then read its section "What your interface has to handle". Each case is a
situation the record can be in and what your interface has to do about it. They are the
awkward ones on purpose.

The file also lists situations no fixture covers yet. If you hit one, say so.
Adding fixture coverage for a gap is a useful pull request.

## Deploying it

This is yours to own. The landing page's hosting is decided, and the full app's
is a later proposal. `STATEMENT-OF-WORK.md` has the details, and the short
version is below.

- **Build on the checks that exist.** `.github/workflows/ci.yml` already runs
  typecheck, lint and tests on every pull request. Add a deploy on merge. The
  landing page is the first thing deployed, so the pipeline works before there
  is anything interesting to show.
- **The landing page runs on Cloudflare Workers, on the free plan,** as static
  assets. The sponsor owns the Cloudflare account and is its only dashboard
  user. GitHub Actions deploys with a token that can only edit Workers.
  Cloudflare can also publish straight from a GitHub repository by itself. That
  stays switched off, so only the pipeline decides what goes live. The sponsor connects `sagasproject.org` in the dashboard.
- **Deploys stay switched off until the public copy is approved** by the
  sponsor. Post the copy in the questions issue when it's ready.
- **Where the full app runs is a later proposal, with costs.** The sponsor
  signs up for whatever is approved, so nobody on the team needs a payment
  method.
- **A preview for each pull request comes later,** if a proposal makes the case
  for it.

Keep the app portable. Nothing load-bearing should depend on one host's
special behaviour, which is why putting the web app and the API in containers is
on the backlog.

Spatial queries are the expensive part of this layer, which is one of
the reasons `apps/ui-api` is a separate app.

Nothing about the local setup changes for any of this. `pnpm dev:web` is the
same either way.

## Things you might add

None of these are required, and whether to add them is your call.

- **Storybook.** `/dev` is a rough version of what it does. If you want the real
  thing, add it. Keep the acceptance criteria visible next to the components,
  because that pairing is the point of the page.
- **Rendering tests.** Vitest is wired up and there are tests for the pure
  functions, but nothing renders a component. Testing Library is one option
  if you want that, and it is worth having before the design starts
  moving.
- **Automated accessibility checks.** The target is WCAG 2.1 AA. Nothing
  currently enforces it.
