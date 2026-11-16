# Content layer backlog

Stories for this layer. I'll add more on Thursdays, starting 5 November.

**How to read a story.** Each `###` heading is one story. If you track work in
GitHub issues, you can paste a story into one as it is. **Goal** says what it's
for, **Done when** is what we check, **Not in this story** says what to leave out,
and **Status** says whether it can start now (**Ready**) or comes later, in the
order below (**Later**).

The steps in `docs/PHASE-2-CONTENT-LAYER.md` come first. These stories follow
them.

---

### C1 · A contributor can record at a site

**Status:** Later, after the new record fields from contract 2.4.0.

**Goal.** Someone standing at a place opens the capture app on their phone,
records what they know about it, and hands it over. The terms come first, in C6.

**Done when:**
- They can record audio in the browser, play it back, and then submit it.
- The record is attached to a site, and stores the terms version it was made
  under (`termsVersion`) and the contributor's choices (`choices`).
- It works from a phone on the same wifi. Browsers only allow the microphone on
  HTTPS pages or on `localhost`, so a phone opening the laptop's `http://` address
  gets no microphone. Serving the app over HTTPS is part of this story.

**Not in this story.** Recording anybody else's story. Test it with your own
voice, because recordings of other people stay out of the app for now.

### C6 · Show the terms before a first record

**Status:** Later, after the new record fields from contract 2.4.0.

**Goal.** The first time someone contributes, they see the terms and accept them before
they submit anything, and they see them again when the terms change.

**Done when:**
- A guest sees `docs/TERMS.md`, read from that file, before their first record.
- Accepting stores the version on their profile (`termsAcceptedVersion`).
- When the version changes, they see the terms again before their next record.
- The API saves no record for someone who hasn't accepted the current version.

**Not in this story.** The wording, which is the sponsor's.

### C2 · Black out personal details before saving

**Status:** Later, if you have the capacity.

**Goal.** Documents people hand over often carry names, phone numbers and email
addresses that have nothing to do with the place. A contributor can black those
out before the file is saved.

**Done when:**
- A contributor can mark areas on a scanned page or a photo and black them out.
- The file that goes to storage has the marked areas removed from its pixels, so
  no one can recover them by lifting a layer off the image.
- You test it with a document you invent yourselves, with made-up contact details.

**Not in this story.** Finding personal details automatically, and PDFs with text
you can select, which need more than covering the page image.

### C3 · Add a transcript to part of a recording

**Status:** Later, once `POST /records` and `GET /records/:id` work.

**Goal.** A recording is where most of the text in this project comes from, and
nothing can use what it says until someone writes it down. Somebody can transcribe
one stretch of a recording without doing the rest, and more than one person can
transcribe the same stretch.

**Done when:**
- `POST /records` takes a record with `text` and a `parent` whose `role` is
  `transcript`, with the recording's `recordId`, an optional `window`, and a `method`.
  It stores it like any other record.
- It answers 400 if the parent recording doesn't exist, or if the parent isn't valid
  (the contract's `recordParent` checks the shape).
- Two transcripts of the same window both stay, each credited to whoever wrote it.
- `GET /records/:id/transcripts` returns every transcript of a recording.

**Not in this story.** A screen for typing a transcript, machine transcription, and
an audio player that follows the text.

### C4 · Say which parts of a recording have a transcript

**Status:** Later, after C3.

**Goal.** Other code needs to know how much of a recording can be read. A claim that
cites 0:18 to 1:10 only gets the part of its score that depends on what it says once
that stretch has a transcript, and the scoring graph reads this as `transcribedWindows` in `packages/fixtures/scoring/graph.ts`.

**Done when** `GET /records/:id/coverage` returns the stretches that have a transcript,
in order, with these cases tested:
- A recording with no transcripts returns an empty list.
- A transcript with no `window` covers the whole recording.
- Overlapping windows, like 0:10 to 0:40 and 0:30 to 1:00, come back as one stretch.
- Windows with a gap between them come back as two stretches.

**Not in this story.** Deciding how that changes a claim's score. That's the scorer's
job.

### C5 · Add a translation

**Status:** Later, after C3.

**Goal.** Somebody can translate a written record, a transcript or a claim into another
language, and more than one translation can exist. Nothing here decides which one is
right.

**Done when:**
- `POST /records` takes a record with `text`, a `language`, and a `parent` whose `role`
  is `translation`, pointing at a `recordId` or a `claimId`.
- It answers 400 if a translation has no `language`.
- It answers 400 if the parent `recordId` doesn't exist. A `claimId` is stored as it
  arrives, because claims live in another layer's database.
- Two translations of the same thing both stay, each credited.

**Not in this story.** Translating anything automatically, and disputes about a
translation.

### C11 · Drop a pin to create a place

**Status:** Ready once C13 works.

**Goal.** Someone creates a place by putting a pin on the map, checking where it landed, naming
it, and saying yes. The click is the place's true location. The address only helps the person
check, so Sagas never keeps it.

**Done when:**
- Clicking the map drops a pin, and the person can move it before confirming.
- A confirmation step shows the address for the pin, from Mapbox's free reverse geocoding. It's
  shown on screen only: never saved, cached, or sent to the API. Mapbox's free tier doesn't allow
  storing it, and Sagas doesn't keep home addresses.
- The person gives a name, which is required, and any other names people use for it.
- A clear "Yes, create this place" saves it through the sites API (C13), with the pin as its
  `coordinates`, `coordinatePrecision` set to `approximate`, and `address` set to the name of the
  neighbourhood the pin falls in, from `packages/fixtures/geo/`. The contract still calls that
  field `address`; until it changes, it holds the neighbourhood, never a street address.
- After saving, the new place shows on the map and its page opens, ready for records (C14).

**Not in this story.** Editing or deleting a place. How the reading site shows a place's location
to the public, which is the experience layer's.

### C12 · Find a place, or add it

**Status:** Ready once C13 works.

**Goal.** Before anyone creates a place, they look for it, so the same place doesn't end up on
Sagas twice.

**Done when:**
- A search box searches Sagas's places by name and other names, through the sites API (C13), and
  shows what matches. Choosing one opens its page.
- If nothing matches, the text goes to Mapbox's free geocoder and the map moves there. It searches
  only once the person stops typing, to stay well inside the free limit.
- From there, "Add this place" starts C11 with the pin at that spot and the name filled in.
- Opening the app with `?lng=…&lat=…&name=…` does the same, so the reading site can send people
  here to add a place it doesn't have.
- Search never matches on an address. If it did, a search for a street address would reveal that
  a place sits there.

**Not in this story.** Showing addresses anywhere after confirmation.

### C13 · The sites API

**Status:** Ready.

**Goal.** Places need somewhere to live before records can attach to them.

**Done when:**
- A migration adds a `sites` table with the fields of the contract's `site`. Ids are UUIDs, like
  records.
- `POST /sites` takes a site without `id` or `slug`, checks it against the contract, makes the id,
  and makes the `slug` from the name, unique across sites. It answers 400 with the reason if the
  site doesn't pass.
- `GET /sites?q=…` returns the places whose name or other names contain the text, ignoring case,
  and never matches on `address`. With no `q`, it returns every place.
- `GET /sites/:id` returns one place, or 404.
- Tests cover each of those, and the API starts from a clean database.

**Not in this story.** Editing or deleting a place.

### C14 · Add records to a place

**Status:** Ready once C11 and C13 work.

**Goal.** On a place's page in the capture app, someone adds what they have: a photo, a document,
or a recording.

**Done when:**
- From a place's page, someone can choose a photo, a document or an audio file, or record audio
  (C1). A photo needs a note saying what it shows.
- The terms come first, if they haven't accepted the current version (C6).
- Uploading follows "How an upload works" in `apps/capture-api/README.md`: ask the API for an upload
  address, send the file straight to storage, then tell the API it's done.
- The new record shows on the place's page with its kind, its note and who added it.
- It works on a phone.

**Not in this story.** Transcripts (C3 and C10) and video.

### C7 · A queue of transcription requests

**Status:** Ready once C3 works.

**Goal.** Nobody is asked to transcribe a whole recording, because that's too much for most
people. Transcription happens by request instead: when a claim points at a stretch of a recording
and no transcript covers that stretch, a request for it goes on a queue, and someone transcribes
just that part.

**Done when:**
- `POST /queue/transcripts` takes a `recordId` and a `window` (a start and end in seconds) and
  adds a request. Both are required, because a request always comes from a claim pointing at a
  stretch. It answers 400 if either is missing, or if the record isn't audio or video, or doesn't
  exist.
- If a transcript already covers that window (C4's coverage), no request is added, and the answer
  says so.
- Asking twice for the same window adds one request.
- `GET /queue/transcripts?siteId=…` returns the open requests at that site, oldest first, each with
  its `recordId`, its `window` and when it was asked for.
- When a transcript covering a request's window arrives (C3), the request closes and leaves the
  queue.
- Tests cover each of those.

**Not in this story.** Who sends the requests. Claims live in the intelligence layer, so in the
end the request comes from wherever a claim is written; for now, your tests call
`POST /queue/transcripts` directly. The screen for working a request, which is C10.

### C8 · A queue of translation requests

**Status:** Ready once C5 works.

**Goal.** Claims point at text in English. So when a transcript isn't in English, it needs a
translation before anyone can point at it, and the pipeline is transcription first, then
translation.

**Done when:**
- When a transcript arrives whose `language` isn't English, a translation request for it goes on
  the queue.
- `GET /queue/translations?siteId=…` returns the open requests at that site, oldest first, each
  with the transcript's `id`, its `language` and when the request was made.
- When an English translation of that transcript arrives (C5), the request closes.
- A transcript in English never adds a request.
- Tests cover each of those.

**Not in this story.** Translating claims, which isn't settled yet. Machine translation. The
screen, which is C10.

### C10 · A screen for working a request

**Status:** Ready once C7 works. Needs audio playback.

**Goal.** Someone picks a request from the queue and does just that part. For a transcription
request, they hear the stretch and type what's said. For a translation request, they read the
transcript and write it in English.

**Done when:**
- The screen lists the open requests at a site, from C7 and C8, and someone can pick one.
- For a transcription request, it plays the requested window with 3 seconds of padding before and
  after, so the first and last words aren't clipped. Someone can replay it, and the padding is one
  setting, easy to change.
- Under the player, a text box takes the transcript, and saving sends it to C3 as a transcript of
  the requested window (without the padding), credited to whoever wrote it.
- For a translation request, it shows the transcript's text, and saving sends the English version
  to C5 as its translation.
- When it's saved, the request leaves the queue.

**Not in this story.** Suggesting which request to do next. Machine transcription. Styling beyond
plain and readable.

### C9 · Process each upload in a background job

**Status:** Later, after audio uploads work end to end.

**Goal.** Reading a file's length and format is slow and can fail, so it runs in a background job
instead of inside the request. This is the other kind of queue in this project: jobs, not people.
`README.md` ("Jobs") explains the difference and suggests keeping the job queue in Postgres, with
`graphile-worker` or `pg-boss`.

**Done when:**
- Finishing an upload queues a job, and the job runs `ffprobe` on the file, fills in
  `durationSeconds` (or `width` and `height` for an image), and sets `processing` to `ready`.
- A file `ffprobe` can't read ends up `failed`, with `processingError` saying why, and the job
  doesn't retry forever.
- Restarting the API doesn't lose a queued job.
- A test covers a good file and a broken one.

**Not in this story.** Transcoding, thumbnails, and where the job runs once the site is hosted.

### H1 · A handoff note for your work

**Status:** Ready, for the end of the semester.

**Goal.** Whoever picks up your work next, in spring or later, starts from your note instead of
from scratch. Write it in your own words, in `apps/capture-api/HANDOFF.md`.

**Done when** the note says:
- which stories in this backlog you finished, and where the work for each one is;
- which ones you started, and where each one stopped;
- which ones nobody started;
- how to run your app and its tests;
- anything the next team should know that isn't written down anywhere else, like known problems,
  or a choice you made and why.

**Not in this story.** Finishing the stories that are left, or rewriting this backlog.
