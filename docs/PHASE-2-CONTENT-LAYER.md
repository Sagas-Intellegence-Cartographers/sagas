# Phase 2, foundation: content layer

The project runs in four phases: design, foundation, refinement and
deployment. You're in phase 2, foundation: getting records into your system
and back out, first text, then photos, then recordings. The start guide
(`docs/START-CONTENT-LAYER.md`) is still the syllabus for the semester. This
one has the specifics for this phase, pulled together from the emails and
meetings so far. When this guide disagrees with an older email or document,
this guide wins.

## What you're building

Your layer takes in what people hand over, stores it, and gives it back. A
person hands over an artifact (a paragraph they typed, a photograph, a
recording, a scanned document), and your API turns it into a record.

Your next steps, from the 16 October meeting:

1. Get `GET /records/:id` working, and email me your progress by Friday 23
   October.
2. Get `POST /records` and `GET /records/:id` working on main, and move your
   schema changes into a `002` migration, by the meeting on Friday 30 October.
3. Then move on to storing real text and getting it back, and after that,
   start on photos.

Writing claims has moved to the intelligence layer. Your layer is records, and
later the transcripts and translations attached to them. If you've started
anything for claims, you can stop.

## What a record is, after contract 2.4.0

Contract 2.2.0 settled two things you ran into:

- **One record is one artifact.** A photo and a recording are two records.
  `media` is still a list, for an artifact that arrives in several files, like
  the pages of a scanned letter, and every file in it is the same kind. Your
  one-table-per-media-type schema already fits this.
- **A record arrives without an id.** Validate incoming records with
  `newSourceRecord`, which has no `id`, and let your database generate one.
  `sourceRecord` is the record once it's stored.

Contract 2.4.0 added four things to every record:

- **The contributor's choices** (`choices`): that they have the right to share
  it, whether the student teams may see it, whether it's public now, later or
  never, what happens to a photo's location, and whether it mentions other
  people. Each record keeps its own, and they can change later. A record also
  keeps the version of the terms it was made under (`termsVersion`).
- **A web page as a record** (`link`): an address, with no files.
- **Collections** (`collectionId`): records one profile hands over together
  stay together.
- **Recordings published on submission.** There's no waiting for a transcript
  any more. A transcript covers a time window of a recording (`window`), so
  "transcribe 0:18 to 1:10" is a task of its own.

`apps/capture-api/migrations/010_record_choices.sql` adds the columns for the
first three to the scaffold's `records` table, numbered 010 so it doesn't
collide with your own files. The rest of `sourceRecord` and `mediaRef` in
`packages/contracts/src/model.ts` is worth reading once. The comments say what
each field is for.

## Running it

Docker has to be running. From the repository root:

```bash
cp .env.example .env    # once, then uncomment the sagas_content line
pnpm --filter @sagas/capture-api db:up
pnpm --filter @sagas/capture-api migrate
pnpm --filter @sagas/capture-api dev
```

The API answers on `http://localhost:3001`. Photos and recordings also need
the storage container, `pnpm --filter @sagas/capture-api storage:up` and then
`storage:verify`, which creates the bucket.

To try an endpoint, use curl, or Hoppscotch. With Hoppscotch, install its
desktop app or browser extension; the team found the website on its own
couldn't reach `localhost`.

Use Node 22, as the start guide says. If you see
`connect ECONNREFUSED ::1:5433`, you're probably on an older Node.

## Migrations

`pnpm --filter @sagas/capture-api migrate` runs
`apps/capture-api/scripts/migrate.ts`, which applies each `.sql` file in
`migrations/` once, in filename order, and remembers it by name. Changing a
file that already ran does nothing on a database that has it. So every schema
change goes in a new numbered file: `002_...sql`, then `003_...sql`. If your
own database gets confused while you experiment, run `db:reset`, then `db:up`,
then `migrate`, which gives you a fresh one.

## Adding an endpoint

Every endpoint has the same three steps, like the worked `POST /records` in
`apps/capture-api/src/index.ts`:

1. **Check what came in:** `newSourceRecord.safeParse(req.body)`, or a Zod
   shape of your own for other requests. Send a 400 with the errors if it
   doesn't match.
2. **Do the work,** with `$1` placeholders in every query. A value somebody
   typed never becomes part of the SQL.
3. **Send the result,** 201 for something created, 404 for something that
   isn't there.

## How photos and recordings get uploaded

`apps/capture-api/README.md`, under "Storage", already sets out how uploads
work, and it's worth reading before you start on photos. The main points are
these:

- The browser uploads straight to storage, and your API never handles the
  bytes. Your API hands out a presigned URL: a temporary web address, signed
  by your server, that lets the browser upload one file directly to storage
  for a few minutes.
- Files live under `records/<recordId>/<mediaId>/` in the bucket.
- Never store a URL. Make a fresh presigned URL when somebody asks for a
  file.
- Slow work (reading a recording's length, making thumbnails) runs as a
  background job.

## Checking your API against the guidelines

`packages/fixtures/capture/rules.ts` holds guidelines for your API, written as
tests. They talk to your API over HTTP, so start it first, then in a second
terminal:

```bash
CAPTURE_API_URL=http://localhost:3001 pnpm --filter @sagas/capture-api test
```

The ones that run check the record endpoints: a record in and back out, a 404,
and the 400s. The placeholders are where your layer is heading next (uploads,
storage, what a file says about itself), and each carries hints in its
comment, including the libraries this project expects. A different library is
fine if you can say why. A summary at the end of each run shows which areas
are still open.

Add your own tests next to your code in `apps/capture-api/src` as you build.
If one of the guidelines looks wrong, open a pull request against it with your
reasoning.

## What this phase covers

Here's what I'd expect from this phase. "Partial" means it works for the
common case. "Design only" means a short written proposal.

| Piece | This phase |
|---|---|
| Written records, in and out | Complete |
| Photo upload through presigned links | Complete |
| What a photo says about itself (type, size, when and where it was taken) | Partial |
| Recording upload, and its length from a background job | Partial |
| Large files in parts | Later |
| Phone photo formats (HEIC) | Design only |
| A page for submitting records | Enough to test the API |

## How we'll work

- **Show it in the meeting.** Anything working since the last meeting is what
  we'll look at.
- **Mention me when something's ready,** on GitHub or by email.
- **The contract is shared.** If it looks wrong, tell me and I'll change it
  upstream, rather than editing it in your fork.
- **Ask early.** An hour stuck is normal. A day stuck is a message to me.
