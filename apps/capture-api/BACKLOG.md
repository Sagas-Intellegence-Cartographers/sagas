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
