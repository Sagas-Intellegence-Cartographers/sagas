type Item = { createdAt: string; text: string };

const WINDOW_MS = 10 * 60_000; // guess: 10 minutes
const REPEAT_WEIGHT = 0.1;     // guess: a repeat counts a tenth

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
    const isRepeat = sorted.slice(0, i).some(
      (earlier) =>
        Date.parse(item.createdAt) - Date.parse(earlier.createdAt) <= WINDOW_MS &&
        similarity(item.text, earlier.text) >= 0.8,
    );
    total += isRepeat ? REPEAT_WEIGHT : 1;
  });
  return total;
}