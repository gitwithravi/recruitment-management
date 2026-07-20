import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeDescriptionHtml, stripHtmlToText } from "../src/lib/sanitize-html.ts";

test("sanitizeDescriptionHtml strips script tags from legacy unsanitized descriptions", () => {
  const legacy = "<p>Great role</p><script>alert(document.cookie)</script>";
  const clean = sanitizeDescriptionHtml(legacy);

  assert.ok(!clean.includes("<script"));
  assert.ok(!clean.toLowerCase().includes("script"));
  assert.equal(clean, "<p>Great role</p>");
});

test("sanitizeDescriptionHtml strips disallowed tags and event-handler attributes", () => {
  const legacy = '<img src="x" onerror="alert(1)">Nice team<p onclick="steal()">hi</p>';
  const clean = sanitizeDescriptionHtml(legacy);

  assert.ok(!clean.includes("<img"));
  assert.ok(!clean.includes("onerror"));
  assert.ok(!clean.includes("onclick"));
  assert.equal(clean, "Nice team<p>hi</p>");
});

test("sanitizeDescriptionHtml strips unsafe URL schemes from links", () => {
  const legacy = '<a href="javascript:alert(1)">click me</a>';
  const clean = sanitizeDescriptionHtml(legacy);

  assert.ok(!clean.includes("javascript:"));
  assert.ok(!clean.includes("href"));
});

test("sanitizeDescriptionHtml keeps safe formatting and forces safe link attributes", () => {
  const input = '<p>Apply via <a href="https://example.com">our site</a></p><ul><li>Remote</li></ul>';
  const clean = sanitizeDescriptionHtml(input);

  assert.ok(clean.includes('href="https://example.com"'));
  assert.ok(clean.includes('rel="noopener noreferrer"'));
  assert.ok(clean.includes('target="_blank"'));
  assert.ok(clean.includes("<ul><li>Remote</li></ul>"));
});

test("stripHtmlToText extracts plain text length regardless of markup", () => {
  assert.equal(stripHtmlToText("<p><strong>Hello</strong> world</p>"), "Hello world");
  assert.equal(stripHtmlToText("<script>alert(1)</script>"), "");
  assert.equal(stripHtmlToText("<p></p>"), "");
});
