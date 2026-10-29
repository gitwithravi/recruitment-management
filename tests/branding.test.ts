import assert from "node:assert/strict";
import test from "node:test";

import { APP_NAME_MAX_LENGTH, validateAppName } from "../src/features/settings/validation.ts";
import { LOGO_MAX_SIZE_BYTES, validateLogoFile } from "../src/server/upload-validation.ts";

test("validateAppName trims and collapses whitespace", () => {
  assert.deepEqual(validateAppName("  Acme   Talent  "), { name: "Acme Talent" });
});

test("validateAppName treats blank as reset to default", () => {
  assert.deepEqual(validateAppName("   "), { name: null });
});

test("validateAppName rejects names over the limit", () => {
  const result = validateAppName("a".repeat(APP_NAME_MAX_LENGTH + 1));
  assert.ok("error" in result);
});

test("validateLogoFile allows no file and common raster images", () => {
  assert.equal(validateLogoFile(null), undefined);
  assert.equal(validateLogoFile({ size: 0, type: "" }), undefined);
  assert.equal(validateLogoFile({ size: 1000, type: "image/png" }), undefined);
  assert.equal(validateLogoFile({ size: 1000, type: "image/webp" }), undefined);
});

test("validateLogoFile rejects SVG, unknown types, and oversized files", () => {
  assert.ok(validateLogoFile({ size: 1000, type: "image/svg+xml" }));
  assert.ok(validateLogoFile({ size: 1000, type: "" }));
  assert.ok(validateLogoFile({ size: LOGO_MAX_SIZE_BYTES + 1, type: "image/png" }));
});
