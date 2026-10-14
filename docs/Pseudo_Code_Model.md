

# ---- Contract (scoring-contract.ts) ----
ScoringInput = { sourceType, independentRecordCount, affirmationCount,
                 extensionCount, disputeCount, sourceTypeDiversity,
                 awaitingTranslation }              # no author, by design
Scorer = { weight(input) -> number,
           confidence({independentRecordCount, disputeCount,
                       awaitingTranslation}) -> single_source | corroborated
                                               | well_corroborated | contested }

# ---- Stage 2: independence (replaces the stand-in) ----
function independentRecords(claim, graph):
  seen = {}
  for rec in evidence records on claim and on its extension children:
      if rec.contributorId == claim.contributorId:   skip   # one person, one telling
      if rec.id == claim.sourceRecordId:             skip   # that's the source, not support
      fp = checksum of rec's media, else rec.id             # same file twice = one source
      if fp in seen:                                 skip
      if rec is the source record of any descendant
         claim of this one (via parentClaimId):      skip   # self-corroboration loop
      seen.add(fp)
  return count(seen), plus how many could not be judged   # the missing "unknown" state


# [proposed] one shape for both authored and extracted keywords
Keyword = { id, claimId,
            kind: date | place | person | event | quantity | attribution | topic,
            surface,      # the literal phrase, never replaced
            reading,      # tidied form, e.g. a year range, kept apart from surface
            language,
            origin: authored | extracted,
            status: proposed | confirmed,    # extracted ones start as proposed
            extractorVersion }

# ---- Stage 2a: extract (runs upstream and is stored, not run inside the scorer) ----
function extractKeywords(claim):
  keywords = []
  for d in claim.details: add Keyword(origin=authored, status=confirmed)
  for t in claim.topics:  add Keyword(kind=topic, origin=authored)

  text = claim.text if rendered else claim.sourceLanguageText
  for phrase in findStructured(text):        # dates, numbers, place pointers
      if no authored detail already covers it:
          add Keyword(origin=extracted, status=proposed)
  if rendered:
      for term in findTerms(text): add Keyword(kind=topic, extracted, proposed)

  # untranslated claims: structured terms only; claim stays visible and weight stays 0
  # never overwrite an authored detail; never normalize away the surface phrase
  # person-kind terms are not extracted for cross-claim use (see guardrails)
  return keywords, stamped with extractorVersion

# ---- Stage 2b: match across claims ----
function matchAcrossClaims(site):
  group keywords by (kind, comparable key)   # place pointer, year-range overlap,
                                             # quantity, topic term
  for each group spanning more than one claim:
      values agree    -> propose "same reading"
      values differ   -> propose "competing readings"
  return proposals        # never written to the graph without a person confirming

# ---- Per-keyword support (reuses Stage 2 independence) ----
function keywordSupport(group):
  claims  = claims in the group asserting the same value
  indep   = independentRecords(claims)       # counts records, not claims or mentions
  disputes = disputes whose targetDetailId is in this group
  return { independentRecordCount: indep, disputeCount: disputes }

detailConfidence = confidence({ ...keywordSupport(group), awaitingTranslation })

# ---- Stage 3: build input from a claimState ----
input = {
  sourceType, sourceTypeDiversity,
  independentRecordCount: independentRecords(...),
  affirmationCount: affirmations.length,         # becomes passover.sounds_right later
  extensionCount:   extensions.length,
  disputeCount:     sum of disputes over detailStatuses,
  awaitingTranslation: claim.awaitingTranslation,
}

# ---- Stage 4: weight (satisfies the 7 required rules) ----
function weight(input):
  if input.awaitingTranslation: return 0          # required: exactly 0
  support = A*log1p(input.independentRecordCount)
          + B*log1p(input.extensionCount)
          + C*log1p(input.affirmationCount)       # small, but > 0
          + D*(input.sourceTypeDiversity - 1)
  return BASE + support / (1 + K*input.disputeCount)
  # damping never goes below BASE, so disagreement is not damage

function confidence(x):
  if x.awaitingTranslation:        return single_source   # never well_corroborated
  if x.disputeCount > 0:           return contested
  if x.independentRecordCount >= 3: return well_corroborated
  if x.independentRecordCount >= 1: return corroborated
  return single_source

# ---- Stage 5: propagate (November) ----
for MAX_ITER rounds, claims in sorted id order:
    child support flows to parent along extension edges (damped);
    disputes push down per detail
stop when change < epsilon
assert every claim and every edge was visited      # the "no skipped path" test

# ---- Stage 6 ----
primary reading = highest weight among competing readings of a detail;
the rest stay visible, in arrival order


# -- Notes --
Starting claims atart at Zero weight
Rescored when second claim comes no matter what type it is
Number of sources and types will have different scores
Teir list of score types
Region and original language will matter for score
Keywords will be a percent range match
Assuming user is are acting in good faith
Possiable use of AI for keyword detection
independentRecordCount will keep track of additions to local or same claims


