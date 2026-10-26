/**
 * The list of contributions, in the order they happened.
 *
 * This is the only file anyone writes by hand. Everything else in the fixtures
 * is calculated from it. Adding a contribution here changes every snapshot
 * dated after it, which is the point.
 */

import type {
  CapturedLocation, ClaimDetail, ContributorId, ClaimId, DetailId, EventId,
  FlagId, FlagReason, LanguageCode, MediaDerivative, MediaId, MediaKind,
  LinkSource, PassoverKind, ProcessingState, RecordChoices, RecordId, SiteId,
  SourceType, SubmissionState, TimeWindow, TranscriptId, TranscriptMethod,
  TranslationId,
} from '@sagas/contracts';

/** Every contribution has an id, a time, and someone who made it. */
interface BaseEvent {
  id: EventId;
  at: string;
  /** Who did this. The literal string 'system' for setup events with no person behind them. */
  actorId: ContributorId;
}

export interface SiteCreated extends BaseEvent {
  kind: 'site_created';
  siteId: SiteId;
  slug: string;
  name: string;
  aka: string[];
  coordinates: [number, number];
  address: string;
  city: string;
}

export interface ContributorRegistered extends BaseEvent {
  kind: 'contributor_registered';
  contributorId: ContributorId;
  displayName: string;
  institution?: string;
  /** Omitted means `guest`, which is every profile this semester. */
  verification?: 'guest' | 'verified';
}

export interface ClaimSubmitted extends BaseEvent {
  kind: 'claim_submitted';
  claimId: ClaimId;
  /**
   * The record the conversation this claim belongs to started from. One record
   * can produce several claims.
   */
  sourceRecordId: RecordId;
  /** Records attached as support. Optional. */
  evidenceRecordIds?: RecordId[];
  siteId: SiteId;
  text: string;
  sourceLanguage: LanguageCode;
  sourceLanguageText?: string;
  /** True when submitted in a language other than English with no rendering yet. */
  awaitingTranslation?: boolean;
  /** The part of a recording the claim comes from. */
  sourceWindow?: TimeWindow;
  details: ClaimDetail[];
  sourceType: SourceType;
}

export interface ClaimExtended extends BaseEvent {
  kind: 'claim_extended';
  claimId: ClaimId;
  /** The conversation's source record. The extension's own record, if it has one, is evidence. */
  sourceRecordId: RecordId;
  evidenceRecordIds?: RecordId[];
  parentClaimId: ClaimId;
  /** The detail of the parent it adds to. Omitted when it's about the whole claim. */
  targetDetailId?: DetailId;
  siteId: SiteId;
  text: string;
  sourceLanguage: LanguageCode;
  sourceLanguageText?: string;
  sourceWindow?: TimeWindow;
  details: ClaimDetail[];
  sourceType: SourceType;
}

/**
 * Somebody disputes one detail of a claim. A dispute is a claim of its own, so
 * this makes a claim and the edge that points it at the detail. What the claim
 * says, its details and its source record default from the dispute itself and
 * the claim it targets, so a fixture only spells them out when they differ.
 */
export interface ClaimDisputed extends BaseEvent {
  kind: 'claim_disputed';
  edgeId: string;
  /** The dispute's own claim. */
  claimId: ClaimId;
  /** Defaults to the disputed claim's source record: the same conversation. */
  sourceRecordId?: RecordId;
  evidenceRecordIds?: RecordId[];
  /** Defaults to the reasoning. */
  text?: string;
  /** Defaults to one detail holding the proposed value, when there is one. */
  details?: ClaimDetail[];
  /** Defaults to the disputed claim's. */
  sourceType?: SourceType;
  targetClaimId: ClaimId;
  targetDetailId: DetailId;
  reasoning: string;
  proposedValue?: string;
}

export interface PassoverRecorded extends BaseEvent {
  kind: 'passover_recorded';
  passoverId: string;
  claimId: ClaimId;
  passoverKind: PassoverKind;
}

export interface TranslationSubmitted extends BaseEvent {
  kind: 'translation_submitted';
  translationId: TranslationId;
  claimId: ClaimId;
  targetLanguage: LanguageCode;
  text: string;
}

export interface TranslationDisputed extends BaseEvent {
  kind: 'translation_disputed';
  disputeId: string;
  translationId: TranslationId;
  reasoning: string;
}

/**
 * One file arriving with a record.
 *
 * `storageKey` is where the bytes live in object storage. It is not a URL, and
 * nothing should turn it into one and keep it. Read links are generated when
 * somebody asks and they expire.
 */
export interface MediaDescriptor {
  mediaId: MediaId;
  kind: MediaKind;
  storageKey: string;
  contentType: string;
  byteSize: number;
  checksum?: string;
  originalFilename?: string;
  /** Defaults to 'uploaded'. Nothing has looked at the file yet. */
  processing?: ProcessingState;
  durationSeconds?: number;
  width?: number;
  height?: number;
  capturedAt?: string;
}

/** Somebody hands something over. */
export interface RecordSubmitted extends BaseEvent {
  kind: 'record_submitted';
  recordId: RecordId;
  siteId: SiteId;
  note?: string;
  text?: string;
  language?: LanguageCode;
  capturedAt?: string;
  capturedLocation?: CapturedLocation;
  media?: MediaDescriptor[];
  /** Set when the record is a web page. */
  link?: LinkSource;
  /** The collection it was handed over in, and the contributor's note on it. */
  collectionId?: string;
  collectionNote?: string;
  /** Defaults to the fixtures' invented choices: everything shared. */
  choices?: RecordChoices;
  /** Defaults to the fixtures' invented terms version. */
  termsVersion?: string;
  /** Defaults to 'submitted'. */
  submission?: SubmissionState;
}

/**
 * A background job finished with a file, or failed on it.
 *
 * This is the event that makes the difference between "your upload broke" and
 * "we are still working on it" visible to the person who uploaded.
 */
export interface MediaProcessed extends BaseEvent {
  kind: 'media_processed';
  mediaId: MediaId;
  recordId: RecordId;
  processing: ProcessingState;
  processingError?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  derivatives?: MediaDerivative[];
  /** Where the record goes next, if this finishing moves it along. */
  submission?: SubmissionState;
}

/** Somebody writes down what is on a recording. */
export interface TranscriptSubmitted extends BaseEvent {
  kind: 'transcript_submitted';
  transcriptId: TranscriptId;
  recordId: RecordId;
  language: LanguageCode;
  text: string;
  method: TranscriptMethod;
  /** The part of the recording it covers. Omitted means all of it. */
  window?: TimeWindow;
  submission?: SubmissionState;
}

/** Somebody reports a record for review. Reasoning is required. */
export interface RecordFlagged extends BaseEvent {
  kind: 'record_flagged';
  flagId: FlagId;
  recordId: RecordId;
  reason: FlagReason;
  reasoning: string;
}

export type ContributionEvent =
  | SiteCreated
  | ContributorRegistered
  | ClaimSubmitted
  | ClaimExtended
  | ClaimDisputed
  | PassoverRecorded
  | TranslationSubmitted
  | TranslationDisputed
  | RecordSubmitted
  | MediaProcessed
  | TranscriptSubmitted
  | RecordFlagged;
