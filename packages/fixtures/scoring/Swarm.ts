type Item = { id: string; createdAt: string; text: string };

const WINDOW_MS = 10 * 60_000; // guess: 10 minutes
const MIN_SIMILARITY = 0.8;
const DECAY = 0.1;             // guess: each later member counts a tenth of the one before


/** How much each claim counts. The first in a swarm counts 1, the next 0.1, then 0.01... */
export function swarmWeights(
  items: Item[],
  similarity: (a: string, b: string) => number,
): Map<string, number> {
  const sorted = [...items].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  // Put each claim in the first swarm that has a close, similar member. Otherwise start a new one.
  const swarms: Item[][] = [];
  for (const item of sorted) {
    const swarm = swarms.find((members) =>
      members.some(
        (m) =>
          Date.parse(item.createdAt) - Date.parse(m.createdAt) <= WINDOW_MS &&
          similarity(item.text, m.text) >= MIN_SIMILARITY,
      ),
    );
    if (swarm) swarm.push(item);
    else swarms.push([item]);
  }

  const weights = new Map<string, number>();
  for (const members of swarms) {
    members.forEach((m, k) => weights.set(m.id, DECAY ** k));
  }
  return weights;
}

/** Total agreement after damping: close to the number of swarms, not claims. */
export const dampedCount = (
  items: Item[],
  similarity: (a: string, b: string) => number,
): number =>
  [...swarmWeights(items, similarity).values()].reduce((sum, w) => sum + w, 0);