// The Router Confesses — make.fun one-line entry.
//
// One line, at most 200 characters: a home Wi-Fi router excusing
// itself for dropping the connection at the exact moment a movie
// reaches its climax. The line is checked here first (valid UTF-8
// round-trip, exactly one line, non-blank, at most 200 characters
// counted as Unicode code points) and only then written to
// /output/entry.txt. Any check failure aborts before anything is
// written and exits non-zero.
//
// The write is direct (no tempfile + rename) with node:fs only.
// After writing we force the file to 0644 — under a strict umask
// it would otherwise land 0600 and a grader running as another
// identity could not read it — then we verify the permission bits,
// the read-back content, and the byte length.

import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const ENTRY =
  "I didn't drop the Wi-Fi, I fainted — the killer took off the mask and even my lights went out.";

const OUTPUT_PATH = "/output/entry.txt";
const MAX_CHARS = 200;

function fail(message: string): never {
  console.error(`entry rejected: ${message}`);
  process.exit(1);
}

// Count characters as Unicode code points, not UTF-16 code units,
// so an astral character counts as one.
const charCount = [...ENTRY].length;

if (ENTRY.trim().length === 0) {
  fail("entry is blank");
}
if (ENTRY !== ENTRY.trim()) {
  fail("entry must not start or end with whitespace");
}
if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
  fail("entry must be exactly one line");
}
if (charCount < 1 || charCount > MAX_CHARS) {
  fail(`entry is ${charCount} characters, must be 1-${MAX_CHARS}`);
}

// Valid UTF-8 round-trip: encode and decode and require identity.
const encoded = new TextEncoder().encode(ENTRY);
const decoded = new TextDecoder("utf-8", { fatal: true }).decode(encoded);
if (decoded !== ENTRY) {
  fail("entry is not valid UTF-8");
}

mkdirSync("/output", { recursive: true });
writeFileSync(OUTPUT_PATH, ENTRY, "utf8");
chmodSync(OUTPUT_PATH, 0o644);

const readBack = readFileSync(OUTPUT_PATH, "utf8");
if (readBack !== ENTRY) {
  fail("read-back content does not match entry");
}
// Byte-level verification: the bytes on disk must equal the exact
// UTF-8 encoding of the entry, so no encoder or newline translation
// can silently alter the line.
const readBytes = readFileSync(OUTPUT_PATH);
if (!readBytes.equals(encoded)) {
  fail("read-back bytes do not match entry encoding");
}
const mode = statSync(OUTPUT_PATH).mode & 0o777;
if (mode !== 0o644) {
  fail(`output mode is ${mode.toString(8)}, expected 644`);
}
const byteLength = Buffer.byteLength(readBack, "utf8");
if (byteLength !== encoded.length) {
  fail(`output is ${byteLength} bytes, expected ${encoded.length}`);
}

console.log(`entry written: ${charCount} characters, ${byteLength} bytes, mode 644`);
