/**
 * The data definition.
 *
 * Each thing gets a Zod schema and a TypeScript type right next to it. The
 * schema checks data at runtime, when you've read a file or received a request
 * and TypeScript can no longer help you. The type is derived from the schema,
 * so the two can't drift apart.
 *
 * ---
 *
 * These shapes are deliberately flat and repetitive. Look at the two edge
 * types below: each starts with an id, a contributor, and a timestamp, and
 * nothing captures that. `translationDispute` and `disputeEdge` are the same
 * idea applied to different targets, and nothing captures that either.
 *
 * It's written out longhand so you can read the whole thing without decoding
 * an inheritance chain, and so the patterns are yours to find rather than ours
 * to impose. Finding them is part of the job. A pull request that collapses the
 * edge types into one, with a reason, is exactly the kind of contribution we want.
 *
 * `docs/DESIGN-QUESTIONS.md` lists the ones we already know about, along with
 * the arguments on each side. Start there before you refactor anything, and add
 * to it when you find one we missed.
 *
 * ---
 *
 * HOW TO FIND YOUR PART
 *
 * Sections are banner-commented and labelled. Search for the label.
 *
 *   SHARED · Identifiers          ids, all of them plain strings for now
 *   SHARED · Vocabularies         the fixed lists: languages, source types
 *   SHARED · Places and people    sites and contributors
 *   CONTENT LAYER · Records       what people hand over, and their files
 *   SHARED · Claims               somebody's reading of a record
 *   SHARED · Edges                disputes and extensions
 *   SHARED · Signals              low-effort reactions
 *   CALCULATED                    what a consumer actually receives
 *
 * Most of this is shared on purpose. The content layer takes in records. The
 * intelligence layer takes in claims, disputes and extensions, scores them,
 * and composes sections and passages from them. The experience layer shows
 * all of it. Only the records section belongs mostly to one team.
 *
 * If you are on the content layer, start at CONTENT LAYER · Records.
 * If you are on the intelligence layer, start at CALCULATED, then Claims.
 * If you are on the experience layer, start at CALCULATED and read upward.
 */

import { z } from 'zod';

/* ================================================================== */
/* SHARED · Identifiers                                                */
/* ================================================================== */

/**
 * These are all `string` today, which means TypeScript will happily let you
 * pass a claim id where a contributor id belongs. Branding them would fix that.
 * See DESIGN-QUESTIONS.
 */
export type SiteId = string;
export type ClaimId = string;
export type DetailId = string;
export type ContributorId = string;
export type EventId = string;
export type TranslationId = string;
export type RecordId = string;
export type MediaId = string;
export type TranscriptId = string;
export type FlagId = string;

/* ================================================================== */
/* SHARED · Vocabularies                                               */
/*                                                                     */
/* Fixed lists every layer reads. Adding a value here is a contract     */
/* change, because somebody's switch statement stops being exhaustive.  */
/* ================================================================== */

/**
 * Languages a record or a rendering can be in. ISO 639-1 codes.
 *
 *   en  English
 *   eu  Euskara (Basque)
 *   es  Spanish
 *   fr  French
 *
 * These four are where the list started, not a statement about which
 * communities matter. Expect it to grow. A record in a language not listed is a
 * reason to add one, never a reason to turn the record away.
 */
export const languageCode = z.enum(['en', 'eu', 'es', 'fr']);
export type LanguageCode = z.infer<typeof languageCode>;

/**
 * How someone came to know a thing. Shown to readers as-is, so they can judge
 * for themselves.
 *
 *   firsthand      "I was there."
 *   family_oral    "My grandmother told me this."
 *   community_oral "This is what people at the Center said."
 *   documentary    "County records show..."
 *   academic       published scholarship
 *   institutional  held by a museum or archive
 *
 * This is never used to reject a contribution, and it is not a ranking. A tier
 * list of source types ("documentary beats oral") is not how a claim is
 * weighed. Weight comes from evidence and from independent support. A firsthand
 * claim from someone nobody knows can end up better supported than a published
 * paper.
 */

export const sourceType = z.enum([
  'firsthand',
  'family_oral',
  'community_oral',
  'documentary',
  'academic',
  'institutional',
]);
export type SourceType = z.infer<typeof sourceType>;


/**
 * A low-effort reaction to something a reader scrolled past.
 *
 *   sounds_right  reads as plausible to this person
 *   dont_know     outside what this person can judge
 *   dont_care     not what this person is here for
 *
 * These tune what gets shown to whom. They don't create edges, and they are
 * not votes. `sounds_right` is agreement, and adds a negligible amount of
 * weight. A claim covered in `dont_know` isn't doubted, it just hasn't reached
 * anyone able to speak to it.
 */
export const passoverKind = z.enum(['sounds_right', 'dont_know', 'dont_care']);
export type PassoverKind = z.infer<typeof passoverKind>;

/**
 * A coarse label for how well-supported a claim is, worked out from its
 * support. Scoring isn't shown to readers as a number or a rank; whether this
 * label is shown, and whether it stays at all, is open.
 */
export const confidence = z.enum([
  'single_source',
  'corroborated',
  'well_corroborated',
  'contested',
]);
export type Confidence = z.infer<typeof confidence>;

/** What kind of relationship one thing has to another. */
export const edgeType = z.enum(['dispute', 'extension']);
export type EdgeType = z.infer<typeof edgeType>;

/* ================================================================== */
/* SHARED · Places and people                                          */
/*                                                                     */
/* Everything hangs off these two. A site is what claims attach to; a   */
/* contributor is who said something.                                  */
/* ================================================================== */

/** A place somebody designated as meaningful. Records and claims attach to it. */
export const site = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  /**
   * What the community actually calls it. People rarely use a building's full
   * formal name, they use a nickname, and search has to find it either way.
   */
  aka: z.array(z.string()),
  /** [longitude, latitude]. GeoJSON order, which is what PostGIS and Mapbox want. */
  coordinates: z.tuple([z.number(), z.number()]),
  address: z.string(),
  city: z.string(),
  /** Approximate is fine for development. Flagged so nobody cites it as surveyed. */
  coordinatePrecision: z.enum(['approximate', 'surveyed']),
});
export type Site = z.infer<typeof site>;

/** Someone who has contributed. */
export const contributor = z.object({
  id: z.string(),
  displayName: z.string(),
  /** e.g. "County Historical Society". A statement of affiliation, not a credential check. */
  institution: z.string().optional(),
  joinedAt: z.string(),
  /**
   * Everyone in the fixtures is invented. This flag exists so nothing
   * downstream can mistake development data for a real person's testimony.
   *
   * It is a boolean rather than a literal `true` so that code checking it is
   * doing real work. If the type could only ever be `true`, every branch that
   * reads it would be dead code, and the check would quietly disappear the
   * first time someone cleaned up a lint warning.
   */
  fictional: z.boolean(),
  /**
   * Whether the person behind this profile can prove it is theirs.
   *
   * `guest` means the key to the profile lives in a browser; the history it
   * unlocks lives in the database and outlasts the browser. `verified` is not
   * built this semester and no fixture uses it; the field exists now because
   * adding it later would mean deciding, retrospectively, what every
   * contribution made before it counted for.
   *
   * This is a distinctness check. It asks whether this is one person once.
   * It must never come to mean that a verified person's claims are worth more
   * because of who they are. See DESIGN-QUESTIONS, "A profile has no way to say
   * whether anyone can prove it is theirs", for what is still unanswered,
   * including why linking two profiles is not safe to build yet.
   */
  verification: z.enum(['guest', 'verified']),
  /**
   * The version of the terms this profile accepted. Terms are accepted once
   * per profile, at the first contribution, and again when they change. Each
   * record also stores the version it was made under (`termsVersion`).
   */
  termsAcceptedVersion: z.string().optional(),
});
export type Contributor = z.infer<typeof contributor>;

/* ================================================================== */
/* CONTENT LAYER · Records and media                                   */
/*                                                                     */
/* What people hand over, and the files that come with it. This is the  */
/* content layer's section: submission, upload, transcription, reports. */
/*                                                                     */
/* The other layers read `sourceRecord` because every claim points at   */
/* one, but nothing else here is theirs to produce.                     */
/* ================================================================== */

/**
 * A record is what somebody actually hands over: a recording, a photograph, a
 * letter, a page of typing.
 *
 * The photograph exists. What people mostly disagree about is what it shows,
 * and that disagreement lands on a claim, where it is about a reading rather
 * than about the person who brought the photograph in. A record isn't beyond
 * question, though: whether it supports a claim, and whether two records are
 * really independent, can both be disputed (see `docs/DESIGN-QUESTIONS.md`).
 *
 * A record plays one of two parts. As a **source record** it is where a
 * conversation starts (a working idea: claims read from one record), and every
 * claim in that conversation has it as
 * `claim.sourceRecordId`, which is required. As an **evidence record** it is
 * attached to a claim as support, through `claim.evidence`, which is
 * optional. It is the same record either way, and one record can do both in
 * different conversations. The schema is called `sourceRecord` (the comment on
 * it says why) and describes every record.
 */

/** What kind of thing was handed over. */
export const mediaKind = z.enum(['audio', 'video', 'image', 'document', 'text']);
export type MediaKind = z.infer<typeof mediaKind>;

/**
 * Where one uploaded file has got to.
 *
 * `uploaded` means the bytes arrived and nothing has looked at them yet. A file
 * stuck in `processing` is a stalled job rather than a failed upload, and a
 * contributor should be able to tell which of those happened to their recording.
 */
export const processingState = z.enum(['uploaded', 'processing', 'ready', 'failed']);
export type ProcessingState = z.infer<typeof processingState>;

/**
 * Where a record is in its life.
 *
 * A recording is published on submission. It doesn't wait for a transcript: a
 * transcript widens who can use a recording, and it doesn't validate it.
 * Transcription happens afterwards, a time window at a time (see `recordParent`).
 * `awaiting_context` is for an image that still needs its note.
 *
 * Taking a record back isn't a state here. It's the contributor's privacy
 * choice (`choices.public`), which they can change at any time, and deletion is
 * something a person asks for under the terms. What happens to claims built on
 * a record that stops being public is open. See DESIGN-QUESTIONS, "Can someone
 * take their record back?".
 */
export const submissionState = z.enum([
  'draft',
  'submitted',
  'processing',
  'awaiting_context',
  'published',
]);
export type SubmissionState = z.infer<typeof submissionState>;

/**
 * How a record's coordinates were arrived at.
 *
 * `placed` is somebody putting a pin on a map. `geocoded` is derived from a
 * street address. `embedded` is read out of the file, usually a photo's GPS.
 * `inherited` is taken from the place the record is attached to.
 *
 * This list is a starting point and we expect it to be wrong. The requirement it
 * encodes is the part that matters: a record carries a location and says how it
 * got one. A pin somebody's granddaughter dropped and a pin a geocoder produced
 * from a street address are not the same evidence, and storing both as a bare
 * pair of numbers throws that away.
 *
 * Read DESIGN-QUESTIONS before extending this. There is an open argument about
 * whether precision belongs here at all or should be calculated from method and
 * source.
 */
export const locationMethod = z.enum(['placed', 'geocoded', 'embedded', 'inherited']);
export type LocationMethod = z.infer<typeof locationMethod>;

/**
 * Where a record says it was made, when that is known and differs from the place
 * it is attached to.
 *
 * A photo's GPS puts the camera across the street from the building. That is
 * precise, and it is also not the answer to "what is this a photo of", so it is
 * kept apart from `site.coordinates` rather than overwriting them.
 */
export const capturedLocation = z.object({
  /** [longitude, latitude]. GeoJSON order, same as sites. */
  coordinates: z.tuple([z.number(), z.number()]),
  method: locationMethod,
  /**
   * Rough radius the point is good for, in metres. A number rather than a
   * category, because every category list we tried presupposed an answer to the
   * question in DESIGN-QUESTIONS.
   */
  accuracyMetres: z.number().optional(),
});
export type CapturedLocation = z.infer<typeof capturedLocation>;

/**
 * Something generated from an uploaded file: a thumbnail, a waveform, a smaller
 * version for playback, text pulled out of a scan.
 *
 * Derivatives are disposable. Everything here can be rebuilt from the original,
 * and nothing should point at one as though it were the source.
 */
export const mediaDerivative = z.object({
  kind: z.enum(['thumbnail', 'waveform', 'transcode', 'text_extract']),
  storageKey: z.string(),
  contentType: z.string(),
  byteSize: z.number().optional(),
});
export type MediaDerivative = z.infer<typeof mediaDerivative>;

/**
 * One uploaded file.
 *
 * `storageKey` is a key in object storage, not a URL. Links for reading are
 * generated when somebody asks and they expire, so storing one would mean
 * storing something that stops working. Anything that needs to show a file asks
 * for a fresh link.
 *
 * `checksum` lets the system recognise the same file handed over twice. It only
 * matches identical files: a cropped or re-encoded copy has a different checksum.
 */
export const mediaRef = z.object({
  id: z.string(),
  recordId: z.string(),
  kind: mediaKind,
  storageKey: z.string(),
  /** MIME type as found by inspecting the file, not as the browser claimed. */
  contentType: z.string(),
  byteSize: z.number(),
  /** sha256 of the original bytes, hex. */
  checksum: z.string().optional(),
  originalFilename: z.string().optional(),
  processing: processingState,
  /** Set when processing failed, so somebody can be told what went wrong. */
  processingError: z.string().optional(),
  /** Read out of the file itself. Absent until something has looked. */
  durationSeconds: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  /** When the file says it was made. Not when it was uploaded. */
  capturedAt: z.string().optional(),
  derivatives: z.array(mediaDerivative),
  createdAt: z.string(),
});
export type MediaRef = z.infer<typeof mediaRef>;

/**
 * What the contributor chose for one record. Each record keeps its own answers,
 * because someone can be happy for one photograph to be public and not another.
 * Someone's last answers can pre-fill the next record, and every answer can be
 * changed later.
 *
 *   rightToShare    they made it, or have the right to share it. Required.
 *   studentAccess   whether the student teams may see and work with it
 *   public          yes; later (ask me again); no
 *   location        for a photo's embedded location: keep it, show only how
 *                   far it is from the place, or remove it. Unanswered means
 *                   remove.
 *   mentionsPeople  whether it mentions people who are alive, who have died,
 *                   or the contributor isn't sure
 */
export const recordChoices = z.object({
  rightToShare: z.literal(true),
  studentAccess: z.boolean(),
  public: z.enum(['yes', 'later', 'no']),
  location: z.enum(['keep', 'distance_only', 'remove']),
  mentionsPeople: z.enum(['no', 'living', 'died', 'not_sure']),
});
export type RecordChoices = z.infer<typeof recordChoices>;

/**
 * A web page handed over as evidence, like a photograph or a document. Whether
 * a web page can be a source record is open. See DESIGN-QUESTIONS, "Can a web
 * page be the record a conversation starts from?".
 *
 * A link earns weight from what's recorded about it and from independent people
 * relying on it, never from its domain: a `.gov` address says who published a
 * page, not whether the page supports a claim. Whether the page's content is
 * captured when it's added is open. See DESIGN-QUESTIONS, "How does a link
 * become evidence?".
 *
 * `preview` lets a reader see what the page is without leaving Sagas. The
 * contributor types both parts, and Sagas fetches nothing from the page, so the
 * summary is a statement of theirs the community can scrutinise like any other.
 */
export const linkPreview = z.object({
  title: z.string().min(1),
  /** A sentence or two on what the page says, in the contributor's words. */
  summary: z.string().min(1),
});
export type LinkPreview = z.infer<typeof linkPreview>;

export const linkSource = z.object({
  url: z.string().url(),
  preview: linkPreview.optional(),
  /** When the contributor saw the page. Pages change. */
  seenAt: z.string().optional(),
});
export type LinkSource = z.infer<typeof linkSource>;

/**
 * A stretch of a recording, in seconds from the start. `start` is inclusive and
 * `end` exclusive.
 */
export const timeWindow = z
  .object({
    start: z.number().min(0),
    end: z.number().min(0),
  })
  .refine((w) => w.start < w.end, { message: 'A time window has to start before it ends.' });
export type TimeWindow = z.infer<typeof timeWindow>;

/** How a transcript or a translation was made. Machine output is a draft with a name on it. */
export const renderingMethod = z.enum(['human', 'machine', 'machine_corrected']);
export type RenderingMethod = z.infer<typeof renderingMethod>;

/**
 * What a supporting record supports.
 *
 * A record with this set is a supporting record: a transcript of a recording, a
 * translation of a claim, or a second record that describes the first, like a
 * recording talking about a photograph. An evidence record has no parent, since
 * the claim that cites it says what it supports.
 *
 * Exactly one of `recordId` and `claimId` is set. `window` says which part of a
 * recording this covers, and leaving it out means the whole recording.
 *
 * More than one can exist for the same parent, each credited to whoever made
 * it. There is no slot for "the correct one". A transcript and a translation
 * involve judgement, and a single authoritative version would hide that.
 */
export const recordParent = z
  .object({
    role: z.enum(['transcript', 'translation', 'description']),
    recordId: z.string().optional(),
    claimId: z.string().optional(),
    window: timeWindow.optional(),
    method: renderingMethod.optional(),
  })
  .refine((p) => (p.recordId === undefined) !== (p.claimId === undefined), {
    message: 'A supporting record points at one record or one claim.',
  })
  .refine((p) => p.window === undefined || p.recordId !== undefined, {
    message: 'A time window is a stretch of a recording, so it needs a record to point at.',
  });
export type RecordParent = z.infer<typeof recordParent>;

/**
 * An artifact somebody contributed, and the place it belongs to.
 *
 * One record is one artifact: a photograph, a recording, a video, a document,
 * or a piece of typed text. A photograph and a recording describing it are two
 * records, even when they arrive together.
 *
 * `media` is a list because one artifact can arrive in several files: the five
 * pages of a scanned letter, say. Every file in a record's `media` is the same
 * kind. Files of different kinds are different artifacts, so they belong to
 * different records.
 *
 * The shapes that turn up most:
 *
 *   Written record     `text` is set and `media` is empty.
 *   Photo with caption `media` holds one image, `note` says what it is.
 *   Recorded speech    `media` holds audio, `note` may be empty, and
 *                      transcripts arrive later from somebody else entirely,
 *                      a time window at a time.
 *   A web page         `link` is set and `media` is empty.
 *   A transcript       `text` is set, `media` is empty, and `parent` says
 *                      which recording and which window it covers.
 *
 * `note` and `text` are not the same field twice. A note is what somebody says
 * about the thing they are handing over, a caption. Text is the record itself,
 * when the record is writing. Three sentences under a photograph is a note. A
 * thousand words somebody wrote about their grandmother is text.
 *
 * A record is also the reason a contribution can be small. Somebody with a
 * shoebox of photographs and one sentence about each can contribute without
 * also being a transcriber and a translator. Other people do those parts later
 * and are credited for them.
 *
 * Called `sourceRecord` rather than `record` because TypeScript already has a
 * built-in `Record<Key, Value>`, and a type here with that name would shadow it
 * in every file that imported both. The word in conversation and in the docs is
 * still "record".
 */
const sourceRecordFields = z.object({
  id: z.string(),
  siteId: z.string(),
  contributorId: z.string(),
  /**
   * What somebody says about what they are handing over. "This is my
   * grandmother outside the boarding house." Often the only text a record
   * ever gets.
   */
  note: z.string().optional(),
  /** The record itself, when the record is writing. */
  text: z.string().optional(),
  /** The language of `note` and `text`, when there is any. */
  language: languageCode.optional(),
  /** When the thing itself was made, as far as anyone knows. */
  capturedAt: z.string().optional(),
  capturedLocation: capturedLocation.optional(),
  submission: submissionState,
  /**
   * What has arrived so far. A record can exist before its files finish
   * uploading, and a written record has none, so this can arrive empty, null or
   * missing. Whichever it was, it comes out of validation as a list.
   */
  media: z
    .array(mediaRef)
    .nullish()
    .transform((m) => m ?? []),
  /** Set when the record is a web page. */
  link: linkSource.optional(),
  /** Set when this is a supporting record. See `recordParent`. */
  parent: recordParent.optional(),
  /** The collection it was handed over in. See `collection`. */
  collectionId: z.string().optional(),
  /** What the contributor chose for this record. */
  choices: recordChoices,
  /** The version of the terms the record was made under. */
  termsVersion: z.string(),
  createdAt: z.string(),
});

type RecordFields = Omit<z.infer<typeof sourceRecordFields>, 'id'>;

/*
 * The rules every record follows, whether it is arriving or stored.
 *
 * An image cannot say what it is. A recording and a video carry their own
 * account of themselves and a written record is text by definition, but a
 * photograph with nothing attached is an artifact rather than a contribution.
 * Somebody has to say what it shows, and that is what `note` is for.
 */
const hasContent = (r: RecordFields) =>
  r.media.length > 0 || Boolean(r.text?.trim()) || r.link !== undefined;
const hasContentMessage = {
  message: 'A record needs media, text or a link. A note on its own is a caption with nothing to caption.',
};
const linkStandsAlone = (r: RecordFields) => r.link === undefined || r.media.length === 0;
const linkStandsAloneMessage = {
  message: 'A web page is its own record, so a record with a link has no media files.',
};
const oneKind = (r: RecordFields) => new Set(r.media.map((m) => m.kind)).size <= 1;
const oneKindMessage = {
  message:
    'One record is one artifact, so every file in its media is the same kind. Files of different kinds are different records.',
};
const imageHasNote = (r: RecordFields) => !r.media.some((m) => m.kind === 'image') || Boolean(r.note?.trim());
const imageHasNoteMessage = { message: 'An image record needs a note saying what it shows.' };

export const sourceRecord = sourceRecordFields
  .refine(hasContent, hasContentMessage)
  .refine(oneKind, oneKindMessage)
  .refine(imageHasNote, imageHasNoteMessage)
  .refine(linkStandsAlone, linkStandsAloneMessage);
export type SourceRecord = z.infer<typeof sourceRecord>;

/** A record that supports another record or a claim: the same shape, with `parent` set. */
export const supportingRecord = sourceRecordFields
  .extend({ parent: recordParent })
  .refine(hasContent, hasContentMessage)
  .refine(oneKind, oneKindMessage)
  .refine(imageHasNote, imageHasNoteMessage)
  .refine(linkStandsAlone, linkStandsAloneMessage);
export type SupportingRecord = z.infer<typeof supportingRecord>;

/**
 * A record as it arrives, before it is stored: the same, without the `id`.
 * Whoever stores the record decides its id. A database can generate one, and
 * a client that sends its own would collide with that.
 */
export const newSourceRecord = sourceRecordFields
  .omit({ id: true })
  .refine(hasContent, hasContentMessage)
  .refine(oneKind, oneKindMessage)
  .refine(imageHasNote, imageHasNoteMessage)
  .refine(linkStandsAlone, linkStandsAloneMessage);
export type NewSourceRecord = z.infer<typeof newSourceRecord>;

/**
 * The records one profile handed over together, kept whole.
 *
 * Archives judge a record partly by what it arrived with and why it was kept,
 * and pooling records by place loses that. So a place points at records and
 * never takes them over, and each record keeps its collection wherever it's
 * shown.
 *
 * A collection belongs to a profile, which can be a guest, and never to a named
 * person. It records what a profile did and says nothing about who they are.
 * What else a collection carries (who originally made or gathered the records,
 * why they were kept) is open; for now that lives in the contributor's own
 * words in `note`. See DESIGN-QUESTIONS, "What does a collection carry?".
 */
export const collection = z.object({
  id: z.string(),
  contributorId: z.string(),
  recordIds: z.array(z.string()).min(1),
  /** The contributor's own description of the collection, if they gave one. */
  note: z.string().optional(),
  createdAt: z.string(),
});
export type Collection = z.infer<typeof collection>;

/**
 * Somebody reporting a record for review.
 *
 * Reasoning is required for the same reason it is required on a dispute. An
 * unexplained objection cannot be acted on and cannot be answered.
 *
 * Nothing here weighs a flag by who raised it. The obvious design does, and the
 * obvious design also lets an established majority bury a minority claim. See
 * DESIGN-QUESTIONS.
 */
export const flagReason = z.enum([
  'not_mine_to_share',
  'inaccurate',
  'harmful',
  'wrong_place',
  'other',
]);
export type FlagReason = z.infer<typeof flagReason>;

export const flagStatus = z.enum(['open', 'reviewing', 'upheld', 'dismissed']);
export type FlagStatus = z.infer<typeof flagStatus>;

export const flag = z.object({
  id: z.string(),
  recordId: z.string(),
  contributorId: z.string(),
  reason: flagReason,
  reasoning: z.string().min(1),
  status: flagStatus,
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type Flag = z.infer<typeof flag>;

/* ================================================================== */
/* SHARED · Claims                                                     */
/*                                                                     */
/* A claim is somebody's reading of a record. The intelligence layer    */
/* takes claims in, models and scores them, and composes them into      */
/* sections. The experience layer shows them. All three read this.     */
/* ================================================================== */

/**
 * What a claim points at. Every claim has one.
 *
 * `sourceType` and `sourceId` say what it points into: a record, or another
 * claim. `excerpt` is the words it points at, and `window` is the stretch of a
 * recording. With neither, it points at the whole thing, so a first claim about a
 * photograph targets the photograph, and "my family ran it until the war" targets
 * a whole claim.
 */
export const claimTarget = z
  .object({
    sourceType: z.enum(['record', 'claim']),
    sourceId: z.string(),
    excerpt: z.string().min(1).optional(),
    window: timeWindow.optional(),
  })
  .refine((t) => t.window === undefined || t.sourceType === 'record', {
    message: 'A time window is a stretch of a recording, so only a record has one.',
  });
export type ClaimTarget = z.infer<typeof claimTarget>;

/**
 * An excerpt of a claim that something points at.
 *
 * This is what lets someone disagree about the year without disagreeing about
 * the building. Nobody lists a claim's details in advance, and there's no
 * complete list. A claim's details are worked out from what points at it: the
 * claims that target an excerpt of it, and any evidence on it that names an
 * excerpt. So a claim nobody has replied to usually has none.
 *
 * The same words are the same detail. Whether "1948" and "opened in 1948" should
 * count as one is a question for later, so for now they're two.
 */
export const claimDetail = z.object({
  /** Worked out from the claim and the excerpt, with `detailId`. */
  id: z.string(),
  /** The words in the claim text this refers to. */
  excerpt: z.string(),
});
export type ClaimDetail = z.infer<typeof claimDetail>;

/** The id of a detail, from the claim it's in and its excerpt. */
export const detailId = (claimId: string, excerpt: string): string => `${claimId}#${excerpt}`;

/**
 * A typed link inside a claim's own text: this is a date, this is a place, this is
 * a person, this points to a record. The contributor adds it, possibly prompted, or
 * the system suggests it and the contributor confirms.
 *
 * References help with finding and with telling whether a reply is about what it
 * targets. Nothing scores them yet. How they get added is open. See
 * DESIGN-QUESTIONS, "How do you tell whether a reply is about what it targets?".
 */
export const claimReference = z.object({
  kind: z.enum(['date', 'place', 'person', 'record']),
  /** The words in the claim text this marks. */
  excerpt: z.string().min(1),
  /** A site id for a place, or a record id for a record. A person never has one. */
  refId: z.string().optional(),
  status: z.enum(['suggested', 'confirmed']),
});
export type ClaimReference = z.infer<typeof claimReference>;

/**
 * A record attached to a claim to back it up. The evidence supports what the claim
 * targets. `excerpt` is for evidence that backs particular words in this claim's own
 * text, and naming one makes that excerpt a detail of this claim.
 *
 * If a claim targets an evidence record, that starts a new thread with that record
 * as its source.
 */
export const claimEvidence = z.object({
  recordId: z.string(),
  excerpt: z.string().min(1).optional(),
});
export type ClaimEvidence = z.infer<typeof claimEvidence>;

/** An assertion somebody reads out of a record. */
export const claim = z.object({
  id: z.string(),
  siteId: z.string(),
  contributorId: z.string(),
  /** The readable text. If the claim was given in another language, this is the rendering. */
  text: z.string(),
  sourceLanguage: languageCode,
  /**
   * The claim as it was actually given, when that wasn't English. A real
   * field, not an attachment, so nothing is lost by rendering it.
   */
  sourceLanguageText: z.string().optional(),
  references: z.array(claimReference),
  sourceType,
  createdAt: z.string(),
  /**
   * The source record: the record the conversation this claim belongs to
   * started from. Required.
   *
   * "Conversation" is a working idea that may be dropped. The source record is
   * what groups the claims read from it, so build on this field.
   *
   * Every claim is part of a conversation about something that exists. Without
   * this there is no route from a sentence in an article back to the recording
   * or photograph it came out of, and no way for a reader to check a reading
   * against the thing being read.
   *
   * One record often produces several claims. Somebody writes three paragraphs
   * about a building and three separate assertions come out of it, each of which
   * can be corroborated or disputed on its own.
   */
  sourceRecordId: z.string(),
  /**
   * What this claim points at: part of a record, or part of another claim.
   *
   * When it points at a recording, `window` can name the stretch: "35:00 to 37:10"
   * of a two-hour interview, so anyone checking it goes straight to the moment.
   * Until that window has a transcript, the claim keeps the weight it gets from
   * evidence and behaviour, and the part that comes from the claim itself (its
   * details and its relations to other claims) isn't counted yet.
   */
  target: claimTarget,
  /**
   * Evidence records: records attached to this claim to back it up. Optional,
   * so often empty.
   *
   * The same record can be the source of one conversation and evidence in
   * another. The record does not change. Its part in each place does.
   */
  evidence: z.array(claimEvidence),
  /** Set when this was added as context on another claim. */
  parentClaimId: z.string().optional(),
  /**
   * Set when this claim disputes a detail of another claim. A convenience copy
   * so a claim list can tell disputes apart without a join. The dispute edge is
   * the real record of what it targets.
   */
  disputedClaimId: z.string().optional(),
  /**
   * True when a claim is in the archive and readable in its original language
   * at the site it belongs to, but nobody has rendered it into English yet.
   *
   * It is visible and attributed, never deleted and never hidden. Until it's
   * rendered, the part of its weight that depends on what it says isn't
   * counted, because nothing can be compared against it yet. It keeps what it
   * gets from evidence and behaviour.
   */
  awaitingTranslation: z.boolean(),
});
export type Claim = z.infer<typeof claim>;

/** Someone saying a rendering gets something wrong. Kept permanently. */
export const translationDispute = z.object({
  id: z.string(),
  /** The id of the supporting record that holds the translation. */
  translationId: z.string(),
  contributorId: z.string(),
  /** "The original says X, this renders it as Y." */
  reasoning: z.string(),
  createdAt: z.string(),
});
export type TranslationDispute = z.infer<typeof translationDispute>;

/* ================================================================== */
/* SHARED · Edges                                                      */
/*                                                                     */
/* What people do to a claim: disagree with part of it, or add context. */
/* These are the graph.                                                 */
/* ================================================================== */

/**
 * Someone disagreeing with one specific part of a claim.
 *
 * A dispute is a claim of its own, connected by this edge. The claim holds what
 * the person asserts instead, with its own source record and evidence,
 * so it can be corroborated, extended or disputed like any other claim. The
 * edge holds what it targets and why.
 */
export const disputeEdge = z.object({
  id: z.string(),
  type: z.literal('dispute'),
  /** The dispute's own claim. */
  fromClaimId: z.string(),
  targetClaimId: z.string(),
  /** Which words. Disagreement always lands on a detail, never a whole claim. */
  targetExcerpt: z.string().min(1),
  /**
   * Why. Required, and checked here rather than left to the interface, because
   * a dispute without a reason isn't a dispute. "This is wrong" cannot be filed.
   */
  reasoning: z.string().min(1),
  /**
   * What they say instead, if they say anything. A convenience copy of the
   * value the dispute's claim asserts, so competing readings can be listed
   * from the edge. The dispute's claim is the real record.
   */
  proposedValue: z.string().optional(),
  contributorId: z.string(),
  createdAt: z.string(),
});
export type DisputeEdge = z.infer<typeof disputeEdge>;

/** Someone adding context to a claim without contradicting it. */
export const extensionEdge = z.object({
  id: z.string(),
  type: z.literal('extension'),
  parentClaimId: z.string(),
  childClaimId: z.string(),
  /**
   * Which words it adds to, the way a dispute names the detail it disagrees
   * with. Left out when the extension is about the whole claim ("my family ran it
   * until the war").
   */
  targetExcerpt: z.string().min(1).optional(),
  contributorId: z.string(),
  createdAt: z.string(),
});
export type ExtensionEdge = z.infer<typeof extensionEdge>;

export const edge = z.discriminatedUnion('type', [disputeEdge, extensionEdge]);
export type Edge = z.infer<typeof edge>;

/* ================================================================== */
/* SHARED · Signals                                                    */
/*                                                                     */
/* Low-effort reactions. They tune what gets shown to whom. They are not */
/* votes and they are not ratings.                                      */
/* ================================================================== */

/**
 * A reader's low-effort reaction. It adds no new node and no new source.
 *
 * "Sounds right" is what used to be a separate affirmation object; it was the
 * same act stored twice. Agreement is not evidence, so it never counts as
 * independent support. It adds a negligible amount of weight, enough that
 * claims with nothing else going for them still come out in an order, and
 * well below every other input. Its main use is routing: what gets suggested
 * to whom.
 */
export const passover = z.object({
  id: z.string(),
  claimId: z.string(),
  contributorId: z.string(),
  kind: passoverKind,
  createdAt: z.string(),
});
export type Passover = z.infer<typeof passover>;

/* ================================================================== */
/* CALCULATED · what a consumer actually receives                      */
/*                                                                     */
/* Nothing below is authored. It is all worked out from everything      */
/* above, and it is what the experience layer renders.                  */
/*                                                                     */
/* Scores are a set of named terms, in the shape the intelligence       */
/* layer's scorer returns (`claimScore`). The fixtures fill them with   */
/* an invented stand-in until the real scorer exists. The counts here   */
/* (`contributorStanding`, `independentRecordCount`) are raw material,  */
/* never a score on their own.                                          */
/* ================================================================== */

/**
 * One ingredient of a score. Behaviour is what a profile has done; content is
 * what a claim and its records carry. The scorer names its own terms.
 */
export const scoreTerm = z.object({
  family: z.enum(['content', 'behaviour']),
  name: z.string(),
  value: z.number(),
});
export type ScoreTerm = z.infer<typeof scoreTerm>;

/** A detail's score, the terms it's made of, and what's behind it. */
export const detailScore = z.object({
  detailId: z.string(),
  excerpt: z.string(),
  score: z.number(),
  terms: z.array(scoreTerm),
  /** True when anyone has disputed this detail. A disputed detail is never reported as settled. */
  contested: z.boolean(),
  /** The claims that dispute or extend this detail. */
  claimIds: z.array(z.string()),
  /** The evidence on those claims, and any evidence on this claim naming the excerpt. */
  evidenceRecordIds: z.array(z.string()),
});
export type DetailScore = z.infer<typeof detailScore>;

/**
 * A claim's score: a composite of its details, its place in the graph, the
 * evidence it carries, independent support and behaviour. This is the shape
 * the intelligence layer's scorer returns for each claim. Readers never see
 * the numbers. They decide what's shown first.
 */
export const claimScore = z.object({
  claimId: z.string(),
  score: z.number(),
  terms: z.array(scoreTerm),
  details: z.array(detailScore),
});
export type ClaimScore = z.infer<typeof claimScore>;

/** One detail of a claim, plus whatever anyone has said about it. */
export const detailStatus = z.object({
  detail: claimDetail,
  disputes: z.array(disputeEdge),
  /** Extensions that add to this detail. Extensions about the whole claim aren't listed here. */
  extensions: z.array(extensionEdge),
  /**
   * Every value anyone has asserted for this detail, in the order they arrived,
   * the claim's own first. Ordering by strength is the intelligence layer's.
   *
   * `count` is how many distinct contributors asserted the value. It is not a
   * vote, and an interface must not present it as one. Showing the readings
   * with their reasoning matters more than showing the number.
   */
  competingValues: z.array(
    z.object({
      value: z.string(),
      count: z.number(),
      contributorIds: z.array(z.string()),
    }),
  ),
  /**
   * How much the claim leans on this detail, from the claim's score. A
   * convenience copy of the matching entry in `claimState.score.details`.
   */
  weight: z.number(),
});
export type DetailStatus = z.infer<typeof detailStatus>;

/** A claim with everything the community has done to it, worked out. */
export const claimState = z.object({
  claim,
  contributor,
  /**
   * The claim's source record and evidence records, copied in.
   *
   * They are already in `graphState.records`, so this is duplication. It is here
   * because almost everything that shows a claim also has to show what it
   * came from, and making every consumer join by hand is how you end up with
   * three slightly different joins. The same reasoning put `contributor` here.
   *
   * The cost is real: one record producing four claims appears four times, and
   * a record with large media metadata pays that four times over. If this
   * becomes a problem it should become a lookup by id, not a half-copy.
   */
  sourceRecord: sourceRecord,
  evidenceRecords: z.array(sourceRecord),
  /** The records that translate this claim. More than one is normal. */
  translations: z.array(supportingRecord),
  translationDisputes: z.array(translationDispute),
  /**
   * Distinct records, other than this claim's own, that other contributors have
   * brought to back it (today: the evidence on extensions of it).
   *
   * A stand-in. Corroboration counts independent records, not people, and this
   * counts records because a record is the one thing the graph can see. How
   * independence is really worked out is the intelligence layer's design work.
   * Agreement ("sounds right") never counts here.
   */
  independentRecordCount: z.number(),
  extensions: z.array(z.string()),
  /** Counts for all three kinds, always present, zero when nobody has reacted. */
  passover: z.object({
    sounds_right: z.number(),
    dont_know: z.number(),
    dont_care: z.number(),
  }),
  detailStatuses: z.array(detailStatus),
  /**
   * The claim's score, in the shape the intelligence layer's scorer returns.
   * In the fixtures it's an invented stand-in (`stand-in-score.ts`), so build
   * against the shape and not the numbers.
   */
  score: claimScore,
  /** A convenience copy of `score.score`, for ordering. */
  weight: z.number(),
  confidence,
});
export type ClaimState = z.infer<typeof claimState>;

/**
 * What one contributor has actually done here.
 *
 * Every field is a count of something that happened. There is no score in this
 * shape and there must not be one. Behaviour is meant to count toward a claim's
 * score: what a profile has done is a behaviour term, and who they are never
 * is. The scorer doesn't read it yet. What
 * any of these counts means, whether a long record of corroborated claims
 * should count for more than a short one, whether somebody who disputes
 * constantly is careful or difficult, is the intelligence layer's design work.
 *
 * This shape is the raw material. An algorithm can only use what the model
 * writes down, so the job here is to record behaviour faithfully and judge
 * none of it.
 *
 * Two of these are worth more than their names suggest:
 *
 * `disputesRaisedWithAlternative` separates "that date is wrong, it was 1914"
 * from "that date is wrong". Both are disputes. Only one of them moves the
 * record forward, and telling them apart needs no reading.
 *
 * `claimsCorroborated` counts claims of theirs that somebody else backed with a
 * record of their own. That is the one signal here that cannot be produced by a
 * person being enthusiastic on their own.
 *
 * What is deliberately missing: there is no vouching. No contributor can stand
 * behind another, so a person who is known and trusted by everyone in the room
 * and has contributed nothing looks identical to a stranger. Whether that
 * mechanism should exist, and what it would do, is in DESIGN-QUESTIONS.
 */
export const contributorStanding = z.object({
  contributorId: z.string(),
  /** Their first and last contribution of any kind, or undefined if none yet. */
  firstContributionAt: z.string().optional(),
  lastContributionAt: z.string().optional(),
  recordsSubmitted: z.number(),
  claimsAuthored: z.number(),
  /** Claims of theirs with at least one independent record. */
  claimsCorroborated: z.number(),
  /** Claims of theirs that somebody has disputed part of. Not a mark against them. */
  claimsDisputed: z.number(),
  disputesRaised: z.number(),
  /** Of those, the ones that proposed a different value instead of only objecting. */
  disputesRaisedWithAlternative: z.number(),
  /** "Sounds right" passovers they left. */
  soundsRightGiven: z.number(),
  translationsContributed: z.number(),
  transcriptsContributed: z.number(),
  flagsRaised: z.number(),
});
export type ContributorStanding = z.infer<typeof contributorStanding>;

/**
 * How well-documented a place is. Drives how its marker looks on the map, and
 * nothing here is shown to readers as a score.
 */
export const integrityScore = z.object({
  totalClaims: z.number(),
  /**
   * Distinct contributors who made claims here. A count of people, so it is
   * not corroboration, which counts independent records.
   */
  independentContributors: z.number(),
  /** Share of claims with at least one independent record. */
  corroborationDepth: z.number().min(0).max(1),
  activeDisputes: z.number(),
  /**
   * How many claims name a date.
   *
   * Counted from date references, so it reflects what people actually said rather
   * than a period somebody chose for them at entry time. A record where nobody
   * has pinned down when anything happened is a thinner record, and this is the
   * part of the score that says so.
   */
  datedClaims: z.number(),
  awaitingTranslation: z.number(),
  /**
   * A 0 to 100 rollup used only to style the map marker. A placeholder formula,
   * never shown as a number and never a ranking of places.
   */
  overall: z.number().min(0).max(100),
});
export type IntegrityScore = z.infer<typeof integrityScore>;

/**
 * A section of a site's page: one heading, and the passage under it.
 *
 * The shape is decided and how a section is produced is not. Which claims
 * belong together, and what the heading says, is the intelligence layer's work.
 * Until that exists, the fixtures carry invented sections, the same way
 * the fixtures' stand-in score stands in for scoring. A section does not list records or claims:
 * what it covers follows from its composition.
 *
 * See `docs/DESIGN-QUESTIONS.md` for what is open about headings.
 */
export const section = z.object({
  id: z.string(),
  siteId: z.string(),
  heading: z.string(),
});
export type Section = z.infer<typeof section>;

/**
 * A stretch of a composition's text, and the claims behind it.
 *
 * `start` and `end` are character offsets into `composition.text`, end
 * exclusive. Selecting a span opens the claims it points at.
 */
export const compositionSpan = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(1),
  claimIds: z.array(z.string()).min(1),
  /**
   * The details the span is about, when it is narrower than a whole claim.
   * Optional on purpose: how finely a composition points into the claims is an
   * open question, so both forms appear in the fixtures.
   */
  detailIds: z.array(z.string()).optional(),
});
export type CompositionSpan = z.infer<typeof compositionSpan>;

/**
 * The readable passage for one section, built from the claims beneath it.
 *
 * How the passage is written, and how it stays coherent as claims arrive, is
 * not decided. The fixtures carry invented passages that show the shape a page
 * can expect: text, plus spans that lead from a phrase back to its claims.
 */
export const composition = z
  .object({
    id: z.string(),
    sectionId: z.string(),
    text: z.string(),
    spans: z.array(compositionSpan),
  })
  .refine((c) => c.spans.every((s) => s.start < s.end && s.end <= c.text.length), {
    message: 'Every span has to sit inside the text, with start before end.',
  });
export type Composition = z.infer<typeof composition>;

/** Everything known about one place, as of one moment. */
export const graphState = z.object({
  stateId: z.string(),
  label: z.string(),
  /** Every contribution up to and including this moment is reflected here. */
  asOf: z.string(),
  site,
  claims: z.array(claimState),
  contributors: z.array(contributor),
  /**
   * Everything handed over for this place, with its files. Supporting records
   * are in here too: a transcript is a record whose `parent.role` is
   * `transcript`, and more than one per recording is normal.
   */
  records: z.array(sourceRecord),
  /** The collections those records arrived in. */
  collections: z.array(collection),
  /**
   * What each contributor has done, as counts and nothing else.
   *
   * This is the intelligence layer's raw material. Anyone who turns it into a
   * single number owns that decision and should write down why.
   */
  standings: z.array(contributorStanding),
  /** Open and resolved reports, kept together. A resolved flag is still evidence. */
  flags: z.array(flag),
  integrity: integrityScore,
  /**
   * The page's sections and the passage under each. Invented stand-ins in the
   * fixtures; see `section`. Empty when nothing has been claimed yet, and for
   * every fixture site except the corner shop, which is the only one with
   * invented sections so far.
   */
  sections: z.array(section),
  compositions: z.array(composition),
  /** Which contributions produced this. The version history is built from these. */
  eventIdsApplied: z.array(z.string()),
  /** What arrived since the previous snapshot, so an interface can say what changed. */
  eventIdsSincePrevious: z.array(z.string()),
});
export type GraphState = z.infer<typeof graphState>;

/** Every schema in one object, for when you want to look one up by name. */
export const schemas = {
  site,
  contributor,
  claim,
  claimDetail,
  claimTarget,
  claimReference,
  claimEvidence,
  claimState,
  graphState,
  section,
  compositionSpan,
  composition,
  integrityScore,
  disputeEdge,
  extensionEdge,
  edge,
  passover,
  translationDispute,
  sourceRecord,
  supportingRecord,
  recordParent,
  linkPreview,
  newSourceRecord,
  recordChoices,
  linkSource,
  collection,
  timeWindow,
  scoreTerm,
  detailScore,
  claimScore,
  mediaRef,
  mediaDerivative,
  capturedLocation,
  flag,
  contributorStanding,
  flagReason,
  flagStatus,
  renderingMethod,
  mediaKind,
  processingState,
  submissionState,
  locationMethod,
} as const;
