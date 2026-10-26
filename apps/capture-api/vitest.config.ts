import { defineConfig } from "vitest/config";

// Any file ending .test.ts under src/ runs. The second reporter prints the
// focus summary after each run: which areas of the guidelines are thin, open
// or failing.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    reporters: ["default", "@sagas/fixtures/scoring/focus-reporter"],
  },
});
