/**
 * Your API, checked against the guidelines in
 * `packages/fixtures/capture/rules.ts`.
 *
 * These talk to your API over HTTP, so it has to be running. In one terminal:
 *
 *   pnpm --filter @sagas/capture-api dev
 *
 * and in another:
 *
 *   CAPTURE_API_URL=http://localhost:3001 pnpm --filter @sagas/capture-api test
 *
 * Without CAPTURE_API_URL they're skipped, so the automated checks stay green
 * on a machine where nothing is running. The focus summary at the end shows
 * which areas still have open guidelines.
 */
import { describe } from "vitest";

import { runCaptureRules } from "@sagas/fixtures/capture/rules";

const base = process.env.CAPTURE_API_URL;

describe.skipIf(!base)("against a running API", () => {
  runCaptureRules("capture-api", base ?? "");
});
