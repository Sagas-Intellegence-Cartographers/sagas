# Setup

Everything you need to run this is on your own machine. **There are no sponsor
credentials to request.** If something appears to need a key you don't have,
that's a bug in the scaffold. Tell us at the next check-in and we'll fix it.

---

## Everyone: the base setup

**1. Install the toolchain**

- **Node 22.10 or later.** Check with `node --version`. If you need to switch
  versions, you can use [nvm](https://github.com/nvm-sh/nvm). This repo has
  a `.nvmrc`, so `nvm use` picks the right one.
- **pnpm 9.** `npm install -g pnpm@9`, or `corepack enable` if you'd rather not
  install it globally.
- **Docker Desktop.** Every team needs it. The experience and intelligence
  layers each run a local Postgres for different jobs, and the content layer
  adds object storage alongside it.

**2. Install dependencies**

```bash
pnpm install
```

**3. Create your env file**

```bash
cp .env.example .env
```

Then fill in what your layer needs. The `db:verify` and `storage:verify`
commands below print the values for you, and the only one you have to go and get
yourself is a Mapbox token.

**4. Confirm it works**

```bash
pnpm fixtures:build   # regenerates the derived graph states, prints a dump
pnpm acceptance      # checks the fixtures against the contract
```

If both pass, your environment is correct. That takes about two minutes and is
worth doing before you write anything.

---

## Getting a Mapbox token

You register your own. This project expects the free tier to cover a semester of development, and having your own means nobody else's usage can use up your quota.

1. Sign up at [account.mapbox.com](https://account.mapbox.com/). When this was written, the free tier did not ask for a card.
2. Go to **Account → Tokens**. There's a **Default public token** already
   created for you, starting `pk.`.
3. Copy it into `.env`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN="pk.your_token_here"
   ```

Notes:

- The `pk.` token is a **public** token. It is meant to be visible in browser
  code. Do not commit your `.env` anyway. It's gitignored, and the habit matters
  more than this particular token.
- Do **not** create or use a secret token (`sk.`). Nothing here needs one.
- If you plan to deploy anywhere public, add a URL restriction to your token in
  the Mapbox dashboard so someone else can't use your quota.

---

## Getting a database

Every layer needs one, and every layer has its own. There are three containers on three ports, each defined by a `docker-compose.yml` sitting next to the app that owns
it. They can all run at once without colliding, and nothing one team changes can
break another team's setup.

| Layer | Where it lives | Port | Database |
|---|---|---|---|
| Content | `apps/capture-api` | 5433 | `sagas_content` |
| Intelligence | `apps/graph-api` | 5434 | `sagas_intelligence` |
| Experience | `apps/ui-api` | 5435 | `sagas_read` |

Change into your app's directory and the commands are the same whichever layer
you are on:

```bash
cd apps/capture-api   # or graph-api, or ui-api

pnpm db:up        # start Postgres 16 with PostGIS
pnpm db:verify    # confirm it's actually working
pnpm db:down      # stop it, keep the data
pnpm db:reset     # delete this layer's data and start over
pnpm db:psql      # open a psql shell inside the container
```

`db:verify` prints your Postgres and PostGIS versions and the connection string
to paste into `.env`. If something is wrong it tells you what to do rather than
printing a stack trace.

**The database is empty on purpose.** There are no application tables. Designing
the schema, the relations, the spatial indexes and the migrations is a
deliverable, and a scaffold that handed it over would be doing your work. What
you get is Postgres with PostGIS and `pg_trgm` already enabled, so you can start
designing instead of fighting extension installs.

The ports start at 5433 rather than 5432 so they do not collide with a Postgres
you may already be running.

---

## Getting object storage

**Content layer only.** If you are not working on submission or media upload,
skip this.

This project keeps files out of Postgres. A 600MB recording in a database column makes backups, restores and queries on that table slow, and it is awkward to stream part of it to somebody skipping ahead in an audio player. Media goes in object
storage and the database keeps a key pointing at it.

```bash
cd apps/capture-api

pnpm storage:up        # start it
pnpm storage:verify    # confirm it works, make the bucket, print your env vars
pnpm storage:down      # stop it, keep the data
pnpm storage:reset     # delete the storage data, leaves your database alone
pnpm storage:mc        # list what is in the bucket
```

`storage:verify` is safe to run repeatedly. It creates the bucket if it is
missing and prints what to paste into `.env`.

It is defined in the content layer's own compose file, so the other two layers
never start it and never need to know it exists.

### What MinIO is

The local object storage is MinIO, which speaks the S3 API. Code you write against it should work against S3, or another provider that speaks the same API, because your code only ever sees an S3 client pointed at a different endpoint
with different credentials.

One line in `.env` is the exception. `S3_FORCE_PATH_STYLE="true"` is there
because MinIO addresses buckets by path and real S3 addresses them by subdomain.
That flag is the whole difference.

Worth knowing: the MinIO community edition was archived in February 2026 and gets no further updates. It still works, and this project keeps it because it only runs on your own machine with invented data. If it ever gets in the way, it can be replaced in `docker-compose.yml` without changing your application code.

### Bucket names are global, and you cannot change one later

`sagas-media` is fine on your machine. Your MinIO is a server of its own and the
only bucket namespace it shares is with itself.

At deployment it is not fine. AWS S3 bucket names are globally unique across
every customer, because a bucket is addressed as `bucket.s3.amazonaws.com` and
that is public DNS, so `sagas-media` is almost certainly taken. Providers differ on this. Some scope names to your account and some do not, so check when you pick one and give
the deployed bucket a name nobody else would take.

Nothing in the local setup needs to change for this. `S3_BUCKET` is already an
environment variable.

### Before you write any upload code

Read the storage section of [`apps/capture-api/README.md`](./apps/capture-api/README.md) first.
It has the bucket layout and the upload flow, and it explains why this project uses presigned uploads from the start.

### You also need ffmpeg

Working out how long a recording is, and making a smaller version people can
actually play in a browser, is `ffmpeg` and `ffprobe`. They are ordinary command
line programs that you install on your machine.

```bash
# macOS
brew install ffmpeg

# Windows, in PowerShell
winget install ffmpeg

# Debian or Ubuntu
sudo apt install ffmpeg
```

Check it with `ffprobe -version`. If that prints something, you are done.

### When object storage will not run

This happens on a locked-down laptop, when Docker fails to start, or when a port is already taken. You are not blocked, and you should not spend a day on it.

**First, run MinIO without Docker.** It is a single binary and it does not need
a container:

```bash
mkdir -p .minio-data
minio server .minio-data --console-address ":9001"
```

Once you set `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`, it uses the same ports and credentials as the container, and your code cannot tell the difference.

**Second, tell us.** If neither route works, say so at the check-in rather than
losing a week to it. We can arrange access to a real bucket through Civum. That
is a slower path because it involves a person, so try the two above first, but it
exists and it is not a favor.

**What not to do:** do not write files to a local folder behind your own
interface and plan to swap it later. This project expects presigned uploads from the start, because a browser uploading straight to storage and a browser sending the file through your API are built differently, and switching later means a rewrite.

---

## Where to start, by team

Each layer has a start guide. It says what to read, what to skip, and what to work on first. Read yours next.

| Your layer | What you need running | Your code | Read this first |
|---|---|---|---|
| **Experience** | Postgres | `apps/web`, `apps/ui-api`, `packages/read-model` | [`docs/START-EXPERIENCE-LAYER.md`](./docs/START-EXPERIENCE-LAYER.md) |
| **Intelligence** | Postgres | `apps/graph-api` | [`docs/START-INTELLIGENCE-LAYER.md`](./docs/START-INTELLIGENCE-LAYER.md) |
| **Content** | Postgres, object storage, ffmpeg | `apps/capture-api`, `apps/capture-web` | [`docs/START-CONTENT-LAYER.md`](./docs/START-CONTENT-LAYER.md) |

If your team was assigned a different layer than the one you expected, your
instructor's assignment wins over this table. Tell me and I will fix it here.

There is one API app per layer, so no two teams edit the same files and each can deploy on its own.

Everyone, whatever layer you are on, reads
[`packages/fixtures/README.md`](./packages/fixtures/README.md)
before calling anything done. It is a list of awkward situations the record can
be in and what your code has to do about each one, and it is the closest thing
this project has to a specification.

[`docs/GIS.md`](./docs/GIS.md) covers location data: the coordinate order that
silently puts Boise in the Indian Ocean, why "within 2km" is not a subtraction
problem, and the index without which every map pan reads every row. Every layer
touches this. Read it before you write a spatial query.

[`docs/GIT.md`](./docs/GIT.md) covers the parts of git that are particular to
this project: adding the upstream remote, why your fork doesn't update itself,
how to pull a contract change forward, and how to send something back to us. It
is not a git tutorial. Read it once after you fork.

Then [`docs/DESIGN-QUESTIONS.md`](./docs/DESIGN-QUESTIONS.md), which is the list
of things in here we know are wrong or unsettled. Read the part that touches
your work before you refactor something, because a few of them look like
sloppiness and aren't.

## When something doesn't work

Check these first:

- **`pnpm install` fails.** Check that `node --version` is 22.10 or later.
- **A workspace import doesn't resolve.** Run `pnpm install` again from the
  repo root, where the workspace is defined.
- **`db:verify` says the container isn't running.** From your app's directory,
  run `pnpm db:up`, wait,
  and try again.
- **`db:verify` or `storage:verify` says a port isn't published.** Something
  else on your machine is already using your layer's port. Find it with
  `lsof -i :5433` for content, `:5434` for intelligence, `:5435` for
  experience, or `:9000` for object storage. Stop it and start the container
  again.
- **Uploads work and then the file 404s.** You stored a presigned URL somewhere
  instead of generating one when it was asked for. See `apps/capture-api/README.md`.
- **`ffprobe: command not found`.** ffmpeg isn't installed. See the object
  storage section above.
- **The map renders gray.** Your Mapbox token is missing or malformed. Check
  `.env` has it, then restart the dev server. Next.js only reads `.env` at startup.
- **A tool says everything passed and you don't believe it.** It may be
  replaying a cached result. [`docs/DEBUGGING.md`](./docs/DEBUGGING.md) covers
  that and the other failures that don't announce themselves.
- **Anything else.** Open an issue on the upstream repo instead of working
  around it quietly. A setup problem you hit is one every future student hits,
  and the fix belongs in this file.
