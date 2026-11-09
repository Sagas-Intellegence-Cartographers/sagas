/**
 * Your scorer. This is the file the rules run against.
 *
 * `score` reads the graph for one place and returns a score for every claim
 * and every detail, each with the terms it is made of. `similarity` says how
 * alike two pieces of text are, from 0 to 1. The shapes are in
 * `@sagas/fixtures/scoring`, and the rules are in `rules.ts` beside them.
 *
 * Start with `similarity`: it is the smallest piece and five rules check it.
 * Then `score`. The relationships between claims are already in the graph,
 * because the people who wrote them chose their targets. Read those links
 * before you reach for the text.
 */

import type {
  Scorer,
  ScoringGraph,
  ScoringResult,
} from "@sagas/fixtures/scoring";

export const scorer: Scorer = {
  similarity(_a: string, _b: string): number {
  
    _a = _a.toLowerCase();
    _b = _b.toLowerCase();

    const _aArray = _a.split(" ");
    const _bArray = _b.split(" ");

    let sequenceCount = commonSequence(_aArray, _bArray, _aArray.length, _bArray.length)
    return sequenceCount / Math.min(_aArray.length, _bArray.length);
    //throw new Error("not implemented");
  },

  score(_graph: ScoringGraph): ScoringResult {
    //throw new Error("not implemented");
    const _recordCount = _graph.records.length;
    const _claimCount = _graph.claims.length;

    const claims = _graph.claims;

    const result: ScoringResult = {
      claims: [],
      matches: []
    };



    for(let i = 0; i < _claimCount; i++){

    }

    return result;


  },
};


 // Longest Common Sequence - comparing similar strings. Next step: character by character processing. Can give similarity points a boost if two
 // words are close enough (crossed / crosses) "crosses the roads" and "crossed the road." How can we determine they're the same? - use stemmer (what we'll do for now) / make own stemmer 
function commonSequence(_a: string [], _b: string [], _aLen: number, _bLen: number) : number {
  if(_aLen === 0 || _bLen === 0){
    return 0; // no similarity between empty strings ykyky
  }

  if(_a[_aLen -1] === _b[_bLen-1]){
    return 1 + commonSequence(_a, _b, _aLen-1, _bLen-1);
  }
  else {
    return Math.max(commonSequence(_a, _b, _aLen, _bLen-1), commonSequence(_a, _b, _aLen-1, _bLen));
  }

}