# Start here — content layer

This repo is bigger than your part of it. Most of what's in here is not yours
and you can ignore it. This page is the short version.

**Treat this as the syllabus for the semester.** Read it through once, then come
back to it. You are not expected to hold it in your head.

**You're now in phase 2, foundation.** For this phase, start with
`docs/PHASE-2-CONTENT-LAYER.md`: running your layer, migrations, the record as
it stands, the guidelines for your API, and what's expected next.

## What you're building

People contribute records of places. A record might be a recording, a
photograph, a scanned document, or just typed text. Your job is the software
that receives all of that, stores it, and makes sense of the files people
upload.

You own two apps. `apps/capture-api` has a starting skeleton and `apps/capture-web` is empty:

- `apps/capture-api`, the server
- `apps/capture-web`, the screen a person is actually looking at

## What the five core terms mean

- **Site.** A place somebody has designated as meaningful. Records and claims
  attach to a site. A site does not attach to them.
- **Record.** What somebody hands over. A recording, a video, a photograph, a
  scanned document, or typed text. Nothing in the graph argues with a record.
  Disagreement lands on claims instead.
- **Claim.** Somebody's reading of a record. The record the conversation started
  from is the claim's source record, and a claim can also carry other records as
  evidence. This is where disagreement lands. One record can produce several claims.
  "Conversation" is a working idea that may be dropped. The source record is
  what groups the claims read from it.
- **Rendering.** A transcript or a translation. One person's version of a
  record or a claim, attributed, with more than one allowed to exist.
- **Profile.** Who a contributor is to the software. This semester a profile is
  a guest id kept in browser storage, and there are no logins.

"Account" is not a term in this project, because it meant a contribution in some
places and a login in others. If you find it in the repository, that is a
leftover and worth a pull request.

## What to ignore

These belong to other teams and nothing you build depends on them.

- `apps/web`, `apps/ui-api`, `packages/read-model`, the reading experience
- `apps/graph-api`, the scoring and claim-graph work
- `packages/fixtures/scoring/`, scoring rules for a different team
- Anything about corroboration, weights, or trust scores

If a document starts talking about claim graphs, you're in the wrong section.

Records and media are yours, and later the transcripts and translations
attached to them. Writing claims, disputes and extensions has moved to the
intelligence layer, and the experience layer shows them on a page.

## What to install first

Do this before you clone anything. There are six things to install, and two of them catch people out.

| What | Version | Where |
|---|---|---|
| **Node** | 22.10 or later | [nodejs.org](https://nodejs.org), or [nvm](https://github.com/nvm-sh/nvm) if you juggle versions |
| **pnpm** | 9 | `npm install -g pnpm@9`, or `corepack enable` |
| **Docker Desktop** | current | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| **ffmpeg** | current | `brew install ffmpeg` · `winget install ffmpeg` · `sudo apt install ffmpeg` |
| **Git** | current | Usually installed. Windows: [git-scm.com](https://git-scm.com) |
| **VS Code** | current | [code.visualstudio.com](https://code.visualstudio.com) |

**Not yet: Mapbox.** You'll need a free token when you build the map picker in
October, and `SETUP.md` covers registering for one then.

Check each one before moving on:

```bash
node -v        # must be 22.10 or higher
pnpm -v        # must start with 9
docker ps      # must print a table, not an error
ffprobe -version
git --version
```

**Two things that will cost you an hour if you skip them:**

**Node version.** Node has to be 22.10 or later. An older
Node fails in ways that never mention Node. If `node -v` prints 18 or 20, fix that
first. The repo has a `.nvmrc`, so `nvm use` picks the right one for you.

**Docker has to be running. Installing it is not enough.** Open the Docker Desktop app
and wait for the whale icon in your menu bar or system tray to stop animating.
`docker ps` printing a table is the test. If it says it can't connect to the
daemon, Docker is not running.

**On Windows**, do all of this inside WSL2 rather than PowerShell. Docker
Desktop has a WSL2 setting to enable, Node and pnpm get installed inside the
Linux side, and the repo lives in the Linux filesystem rather than under
`C:\Users`. Working across the Windows/Linux boundary is slow and produces
line-ending problems that look like real bugs. Ask at a check-in if any of that
is unclear.

## Getting the code, before anyone clicks Fork

**One fork for the whole team.** Three personal forks means three
diverging copies and no single place your work lives.

1. **Create a free GitHub organisation for the team, rather than using a personal account.**
   If the repo lives in one person's GitHub account and that person drops the class,
   the team loses everything, and your instructor needs access for grading.
2. **One person forks `Civum/sagas` into that organisation, once.** That fork is
   now the team's repository.
3. **Everyone clones that fork, including whoever created it.** Nobody forks
   again.

```bash
git clone https://github.com/YOUR-ORG/sagas.git
cd sagas
git remote add upstream https://github.com/Civum/sagas.git
git remote -v    # origin = your fork, upstream = ours
```

So the shape is one upstream, one team fork, three laptops:

```
Civum/sagas              ours
   └── YourOrg/sagas     yours, where all your work happens
          └── laptops    clones
```

Work on branches, open pull requests into your fork's main, review each other.
Pull requests to upstream are for contributing something back. Daily work stays
in your fork. `docs/GIT.md` has the rest, including what to do when a merge goes wrong.

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

With everything above installed and Docker running, run these:

```bash
pnpm install
cp .env.example .env

cd apps/capture-api
pnpm db:up && pnpm db:verify
pnpm storage:up && pnpm storage:verify
```

The database and object storage belong to your app, so those commands live in
`apps/capture-api` and run from there. The other two layers have their own, on
their own ports, and nothing you start here touches theirs.

`db:verify` prints the connection string for your database, which is
`sagas_content` on port 5433. Uncomment that line in your `.env` and leave the
other two alone.

`SETUP.md` has the detail, including what to do when object storage won't start.
Everything runs on your own machine, so there is nothing to sign up for and nothing that can cost money.

## Setting up VS Code

The repo is set up for VS Code. Open the folder and it will offer to
install the recommended extensions, and you should say yes. That gets you ESLint and Prettier
wired to the repo's own config, Docker container management from the sidebar,
inline error messages, and the test runner.

Formatting and lint-fixing on save are already configured, so nobody's editor
reformats a file somebody else wrote.

Use the repo's TypeScript rather than the one bundled with VS Code. It will
prompt you, and you should say yes. Otherwise the editor checks your code with a
different TypeScript from the one the build uses.

## Read these four, in this order

1. `apps/capture-api/README.md`. Start with "This semester", which has the scope.
2. `apps/capture-web/README.md`, shorter, covering the browser side.
3. `packages/contracts/src/model.ts`. Read the **records and media** section
   first, and you can skip the rest. Claims and edges are written by the
   intelligence layer.
4. `packages/fixtures/fixtures/freight-depot/events.ts`, eight example records.
   This project treats them as the spec: code that handles all eight handles every case the fixtures know about.

That's about an hour of reading. Everything else can wait until you need it.

## The plan, month by month

The dates are rough.

**September, setup and the back end for contributions.** Get the stack
running, then get a record from a browser into a database, then get files
uploading to storage and being processed.

**October, the contributing interface.** `apps/capture-web` in earnest.
Recording audio, choosing files, the submission form, and placing a record on
a map. The map is where you will need a free Mapbox token of your own. Each of
you registers your own, and it costs nothing. `SETUP.md`
walks through it when you get there.

**November onward, everything else.** Translation, reporting content, and
whatever the first two months turn out to have missed. We'll scope it when we
get there, with what you've learned by then.

If September takes six weeks, that's fine. This project would rather have a
working thing late than half a thing on time.

## Your first task

This should take about a week, and it is small on purpose.

**Accept a text-only record and store it.**

A record does not need a file. Somebody typing what their grandmother told them
is a complete contribution, and `sourceRecord` in the contract allows exactly
that, media *or* text. So the first thing that works end to end does not involve
uploads at all.

Three pieces, one per person:

- **Database.** Get Postgres running and apply the migration for the `records`
  table, which already ships in `apps/capture-api/migrations/001_records.sql`.
  Check its columns against `sourceRecord` in the contract.
- **API.** One endpoint that accepts a record, validates it against the
  contract's schema, and stores it.
- **Web.** One form that submits to that endpoint. Ugly is fine.

When somebody can type a paragraph into a browser and see it come back out of
the database, the rest of the layer builds on that. Uploads come next.

Express, a connection pool and a migration runner are already in
`apps/capture-api`, so none of your first week goes on choosing a framework or
wiring configuration. `src/index.ts` already holds one worked endpoint,
`POST /records`, so you can see the whole path once: a request arrives, the
contract checks it, a row is written, a response goes back. You don't need a
front end to try it. The top of the file shows a `curl` call that sends a record
straight to the API. Write the read endpoint the same way.

**When the form needs something the endpoint does not give it,** put that in the
check-in note. You own both sides, so building the form is how you find out
what the endpoint is missing.

## About contributors

There are no logins and you should not build any.

A contributor's profile is a **guest id**. It is a random string your web app
generates the first time somebody visits, saves in browser storage, and sends
along with every submission. That is the whole of it, with no password, email
address or verification.

So the flow is: someone opens the site, a guest id is created without them
noticing, they contribute, and the record is attributed to that id. If they come
back on the same browser, it's the same id and their contributions are theirs.
If they clear their browser, they are a new person from then on. Their earlier
contributions are not deleted. Those stay in the database attributed to the old
id, and nobody can get back to them. That is an accepted cost of letting people
contribute without signing up, and it is not a bug you need to solve.

**Testing with more than one person.** Because the guest id lives in browser
storage, and each browser keeps its own, one laptop gives you several
contributors at once. A normal window is one person, a private window is
another, and a second browser is a third. You can also open developer tools and
set the id by hand to become any contributor in the fixture data, which is the
fastest way to reproduce a bug somebody else hit. Logins would make this
harder, since you would have to register and sign in twice to do the
same thing.

The project is trying to work out whether a record can be trusted from what it
says and how it's corroborated, rather than from who said it, so logins are not
this semester's problem.

## What to check every Monday

Check `CHANGELOG.md`. If something moved, it's listed there with an **Affects**
line. If that line doesn't name the content layer, you can ignore it entirely.

If you're unsure whether a change matters, bring it to the
check-in rather than merging it and finding out.

## How we work

- **Check-in, 30 minutes.** Weekly for the first month, then every other week.
- **Office hours, 30 minutes before it.** Runs only if there's something to
  discuss, so most weeks it won't.
- **A short note before each check-in.** Template is in
  `docs/CHECK-IN-TEMPLATE.md`. The most useful part is what you *assumed*,
  because that's how we find out a spec was unclear before you've built two weeks on it.
- **Small pull requests, opened as drafts early.** I would rather see the shape
  at 20% and say "not that direction" than read 800 lines and ask you to start
  over.
- **Between meetings**, expect a reply within a working day rather than the same
  evening. If you are blocked, open a draft pull request or put it in the note.

`docs/WORKING-TOGETHER.md` has the full version.

## What you get from me

- Sample audio, photo and document files behind the fixture data
- Pull request review, personally, every week
- Anything merged upstream is credited to you by name. Your fork is yours
  regardless, and what you write in it stays yours.

## What each tool is for

Reference. Skim it now, come back when a name shows up and you're not sure why
it's there. Each of these has proper documentation online; this is just enough
to know why the project uses it.

### The things you install

**Docker** runs programs in isolated containers so everyone's machine behaves
the same way. Instead of installing Postgres directly and fighting your OS about
it, you run a container that already has it. Docker Desktop is the app that
makes that work on Mac and Windows, and it has to be running for any of it to
happen.

**Postgres** is the database. It's a much bigger tool than SQLite, and the parts
that matter here are that it handles many writers at once, has a real type
system, and has a geographic extension called **PostGIS** for questions like
"what records are within two kilometres of this building". You'll meet PostGIS
later in the semester.

**MinIO** is file storage that speaks the same API as Amazon S3. Photographs and
recordings don't belong in a database, so they go here instead, and the database
just stores a key pointing at them. Running MinIO locally means you write code
against the same interface a real deployment would use, without an AWS account
or a bill.

**ffmpeg and ffprobe** are command line programs for audio and video. They are
standalone programs, which is why they're an install step. `ffprobe` reads a
file and tells you about it without changing it: how long a recording is, what
format it really is, what its bitrate is. `ffmpeg` converts things. You'll use
`ffprobe` to find out that an upload is fourteen minutes long and is actually a
WAV despite being named `.mp3`, and `ffmpeg` to make a small playable version of
a file too big to stream.

**pnpm** installs packages, like npm but stricter about what a
package is allowed to import. This repo is a **workspace**, which means several
packages live in one repository and can depend on each other directly.

**Turbo** runs commands across all those packages at once and caches the
results, so `pnpm lint` doesn't relint things that haven't changed.

### The things already in the code

**Zod** describes the shape of data and checks it at runtime. In this repo it's
the single source of truth: the TypeScript types are derived from the Zod
schemas rather than written twice. When a request arrives, you hand the body to
the schema and either get typed data back or a clear error.

**Vitest** runs the tests.

**Prettier** formats code and **ESLint** catches likely mistakes. Both are
configured already and run on save in VS Code, so you shouldn't have to think
about either.

### Words you'll hit

**Presigned URL.** A temporary link that grants permission to do one specific
thing, usually uploading one specific file, and expires in minutes. It's how a
browser writes directly to storage without your server holding the file or
handing out lasting access.

**Derivative.** A file generated from an uploaded one. A small MP3 made from a
large WAV, a thumbnail from a photo, a waveform from a recording. Derivatives
are disposable by definition: if you lose one you regenerate it from the
original.

**Waveform.** The jagged line you see in any audio player, showing where a
recording is loud and quiet. It's computed by sampling the audio, and it lets
somebody drag to the part they want instead of listening from the start.

**EXIF.** Metadata that cameras and phones store inside photo files, such as the
date taken, the camera model and often GPS coordinates. It's how a photograph can disagree with
where somebody said it was taken, which is one of the nine fixture records.

**Migration.** A file describing a change to the database structure, kept in
version control and applied in order. It's how the database on your laptop and
the one on somebody else's stay the same shape.

**Job queue.** A list of work to do later, outside a web request. Probing a
600MB file takes too long to make somebody wait for it, so the upload finishes
immediately and the probing happens afterwards. That's why records have a
`processingState`.

## You are not expected to finish it

This is an open-source project, and you are not expected to finish it. Whatever you complete is a contribution, and it stays in
the record with your name on it. Build a small thing that works rather than a
large thing that nearly does.
