type Item = { createdAt: string; text: string };

const WINDOW_MS = 10 * 60_000; // guess: 10 minutes
const MIN_SIMILARITY = 0.8;
const REPEAT_FACTOR = 0.1;

/** Total agreement: a claim that repeats an earlier one nearby counts for little. */
export function dampedCount(
  items: Item[],
  similarity: (a: string, b: string) => number,
): number {
  const sorted = [...items].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  let total = 0;
  sorted.forEach((item, i) => {
    const matches = sorted.slice(0, i).filter(
      (earlier) =>
        Date.parse(item.createdAt) - Date.parse(earlier.createdAt) <= WINDOW_MS &&
      similarity(item.text, earlier.text) >= MIN_SIMILARITY,
          ).length;
         total += REPEAT_FACTOR ** matches;
  });
  return total;
}