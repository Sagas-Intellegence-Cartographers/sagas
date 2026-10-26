# apps/capture-api — the content layer

This app is yours, and it ships empty on purpose.

This is the part real people touch. Somebody records something on a phone,
uploads a photograph, types up a letter, adds a translation, or reports
something that should not be public. All of it arrives here.

Designing this is the deliverable. Handing over a set of endpoints would hand
over the decisions that make it interesting.

## This semester

The list under "What goes here, roughly" is the whole domain. This section is the order to build it in.

**The first month is one thing: upload, probe, ready.** A file goes to storage,
a worker probes it, the record says `ready`. Everything else in this document is
downstream of that working. Do not start with the moderation queue because it is
more interesting.

**You own your database.** Records, media, transcripts, translations,
flags. The schema and the migrations are yours, they live in this app, and no
other team touches them. The other two layers run their own databases shaped for
their own problems. The contract lines up between all three. The tables do not
have to, which is why nobody here waits on anybody.

**There is no authentication and you should not build any.** A contributor is a
guest id generated in the browser and sent with the request. No login, no email,
no password. This is deliberate and it is written up in
[`docs/DESIGN-QUESTIONS.md`](../../docs/DESIGN-QUESTIONS.md) rather than
forgotten about.

**There is a browser app too**, `apps/capture-web`, and it belongs to the same team this semester.
An API is not something you can put in front of a person, and being able to do
that is why this layer is here.

**Nothing is hosted.** The stack runs locally. A demo is a laptop, and a session
with somebody in the community is a laptop with a phone on the same wifi.

**Translation: the record is never blocked.** Somebody contributing in a
language other than English finishes, submits, and their record exists, pinned
and attributed and on the map.
`sourceRecord` has no language requirement. Only `claim` does, and that
requirement never blocks the record. Machine translation proposes a draft, a
person confirms or replaces it, and `transcriptMethod` already has
`machine_corrected` for exactly that.

Which model to use is a real decision with a licence attached, and checking the
licence yourself is part of the job. NLLB-200, Whisper and Helsinki-NLP's
`opus-mt-*` models are places to start looking. Read each model card for its
licence and language coverage before relying on it. The communities using this
decide which languages matter.

## What goes here, roughly

- Submitting a record and attaching it to a place
- Uploading audio, photos and documents, including large files on bad
  connections
- Pulling metadata out of uploads: duration, format, dimensions, GPS from photos
- The queue of records waiting for somebody to add context or write a transcript
- Submitting translations and transcripts, with more than one allowed to coexist
- Reporting content, with reasoning attached, and a queue for reviewing reports

Writing claims, disputes and extensions has moved to the intelligence layer.

## Where to start

You need Postgres, object storage and ffmpeg. `SETUP.md` covers all three, and
there are fallbacks there if storage will not start.

```bash
pnpm db:up && pnpm db:verify
pnpm storage:up && pnpm storage:verify
ffprobe -version
```

Then read, in order:

1. `packages/contracts/src/model.ts`, the records and media section. One record
   is one artifact, which may arrive in several files of the same kind, and that
   decision shapes everything here. A record arriving at your API has no id yet
   (`newSourceRecord`); whoever stores it decides the id.
2. `packages/fixtures/fixtures/freight-depot/events.ts`. Eight records,
   deliberately unalike: written records with no files, two photographs handed
   over as one collection (one with embedded GPS across the street), a
   recording transcribed a time window at a time, a web page, and a 604MB
   upload still being processed when the log ends.
3. The acceptance criteria for records in `packages/fixtures/acceptance/`.

The fixture data has no actual files behind it. The storage keys point at
objects that do not exist, because committing a hundred megabytes of invented
audio to a git repository helps nobody. Putting real bytes behind those keys is
a good first job.

## Storage

### Where things go

One bucket, `sagas-media`, laid out by record:

```
records/<recordId>/<mediaId>/<original filename>
records/<recordId>/<mediaId>/derived/<what it is>.<ext>
```

The keys in the fixture data follow this, so you can read them and see the
shape. Two rules behind it: a key never contains anything a person typed, and a
key never has to change. Filenames from uploads contain spaces, accents, and
occasionally somebody's full name, so the `<mediaId>` segment is what makes the
path safe and the original name is kept as metadata rather than as structure.

Derivatives live under the original they came from because they are disposable.
Anything under `derived/` can be rebuilt by running the job again, and nothing
should ever point at one as though it were the source.

### How an upload works

The browser uploads **straight to storage**. Your server never handles the
bytes.

1. The browser asks your API where to put a file, giving a name, a type, and a
   size.
2. Your API decides whether to allow it, invents a `mediaId`, works out the key,
   and asks storage for a **presigned PUT URL** that expires in a few minutes.
   It writes down that this file is expected.
3. The browser PUTs the bytes to that URL. This does not touch your server at
   all.
4. The browser tells your API it finished. Your API checks the object is
   actually there and is the size it was told to expect, marks it `uploaded`,
   and queues a job.
5. A worker probes it with `ffprobe`, builds whatever derivatives it needs,
   fills in duration or dimensions, and marks it `ready`.

Reading works the same way in reverse. **Never store a URL.** Generate a
presigned GET when somebody asks for the file and let it expire. A URL saved in
the database is a URL that stops working, and one that does not expire is a
public link to something a family may not have agreed to make public.

Files big enough to matter need **multipart upload**, which is the same idea
with one presigned URL per part and a call at the end to stitch them together.
That is what makes a 600MB recording survive a phone dropping off wifi halfway
through. Build the single-shot version first, then this.

**The version not to build:** POSTing the file through your own API and having
the API write it onward. It has fewer moving parts, and this project still rules
it out, because your server holds a request open for the length of the upload,
memory goes up with file size, and every timeout in front of it becomes a failed
contribution. Moving from that design to the one above later is a rewrite.

### Jobs

Probing, transcoding, and thumbnailing are slow and they fail, so they run in
the background rather than in a request.

This project expects the queue to live in Postgres. `graphile-worker` and
`pg-boss` are two libraries that do that. You get a queue that is transactional
with the data it is about, survives a restart, and needs no extra service.
Redis would add a container and a set of credentials, and at this size this
project does not think that is worth it.

There are two things called a queue in this project and they are not the same.
The one above is jobs. The other is `submissionState`, records waiting for a
person to add context or write a transcript, and that is a column and a query
rather than machinery.

## Who owns what

This app is yours alone. `apps/graph-api` belongs to the intelligence layer and
`apps/ui-api` to the experience layer. They are separate apps so that no two
teams edit the same files, and so each can be deployed on its own terms.

Your database is yours alone. Each layer runs its own, shaped for its own
problem, and none of them reads another's tables. The only thing shared across
all three is the contract, which is the thing to be careful about: a change to
`@sagas/contracts` or `@sagas/fixtures` reaches every team, so it goes through a
pull request and a check-in rather than into your fork. See `docs/GIT.md`.

## What is already here

You do not have to choose a framework or wire up configuration. Express is
installed, `src/db.ts` holds a shared connection pool, and `scripts/migrate.ts`
applies numbered SQL files from `migrations/`. `src/index.ts` holds one worked
endpoint, `POST /records`, from request to stored row, with the commands to run
it and a `curl` call to try it at the top of the file. Read it and run it, then
write the read endpoint the same way.

```bash
pnpm install
cp .env.example .env      # then uncomment the sagas_content line

cd apps/capture-api
pnpm db:up && pnpm db:verify
```

Your database is `sagas_content` on port 5433, and `db:verify` prints the
connection string for it.

Once you have written a migration and an endpoint:

```bash
pnpm migrate
pnpm dev
```

## The decisions already made

There are three, made so you can start building rather than evaluating. If any of them turns
out to be wrong we change it together, at a check-in.

**Express 5.** A route handler reads as an ordinary function that takes a
request and returns a response, which is the thing worth understanding first.
Version 5 specifically, because when an async handler throws, version 5 hands
the error to your error middleware and version 4 silently hung the request
forever. You will write an async handler for every database call, so you will
hit this.

Many tutorials you find will be for Express 4, and almost all of it transfers
unchanged. These are the changes that will catch you: `app.del()` is now `app.delete()`,
`res.sendfile()` is now `res.sendFile()`, `res.json(obj, status)` is now
`res.status(status).json(obj)`, and `req.param(name)` is gone in favour of
reading `req.params`, `req.body` or `req.query` directly.

**`pg`, with SQL written out.** No query builder and no object relational
mapper. Writing SQL directly keeps the queries visible rather than hidden behind
a layer you would also have to learn. It also means the migrations and
the endpoints are the same subject rather than two.

Two rules come with it. Use `$1`, `$2`, `$3` placeholders and pass values
as the second argument, never string concatenation, so nothing somebody typed is
ever read as SQL. And use the shared `Pool` from `src/db.ts` rather than making a
`Client`, because a single client serialises every request behind the one before
it and you find out the first time two people submit at once.

**Numbered SQL files for migrations**, applied by `scripts/migrate.ts`. There
are tools that do this and the runner is here instead so the mechanism is
visible. It is about forty lines, it applies each file once inside a
transaction, and it records what it applied. Add `002_media.sql` and so on
beside `001_records.sql`.

## The schema

There is none. Records, media, transcripts, translations and flags are all
yours to design, and the columns come from `packages/contracts/src/model.ts`.
When the contract and a table disagree, the contract is right.
