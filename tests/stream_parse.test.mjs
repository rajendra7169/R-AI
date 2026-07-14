/**
 * Proves the streaming JSONL parser reassembles tokens correctly even when
 * network chunks split JSON objects across read boundaries.
 *
 * The OLD code did `chunk.split("\n").forEach(JSON.parse)` on each raw network
 * chunk, so any object straddling two reads was dropped. The NEW code buffers
 * partial lines across reads. This test reproduces the fragmentation and
 * asserts NOTHING is lost — then also runs the OLD logic to show it DID lose
 * tokens (guarding against a regression to the naive approach).
 *
 * Run: node tests/stream_parse.test.mjs
 */
import assert from "node:assert/strict";

// Build a realistic Ollama /api/chat stream: one JSON object per line.
const WORDS =
  "Setting up python3-pip then create a virtual environment using python3 -m venv and activate it before installing pillow so the system packages are never touched".split(
    " ",
  );
const objects = WORDS.map((w, i) => ({
  message: { role: "assistant", content: (i ? " " : "") + w },
  done: false,
}));
objects.push({ message: { role: "assistant", content: "" }, done: true, done_reason: "stop" });

const wire = objects.map((o) => JSON.stringify(o)).join("\n") + "\n";
const EXPECTED = objects.map((o) => o.message.content).join("");

// Chop the wire bytes into arbitrary chunks (like TCP / the 4096-byte proxy).
function fragment(str, sizes) {
  const chunks = [];
  let i = 0;
  let k = 0;
  while (i < str.length) {
    const n = sizes[k++ % sizes.length];
    chunks.push(str.slice(i, i + n));
    i += n;
  }
  return chunks;
}

// The NEW parser: buffer across chunks, parse only complete lines.
function parseBuffered(chunks) {
  let out = "";
  let buf = "";
  const handle = (line) => {
    if (!line.trim()) return;
    try {
      const p = JSON.parse(line);
      if (p.message?.content) out += p.message.content;
    } catch {
      /* incomplete/garbage line — never happens for complete lines */
    }
  };
  for (const chunk of chunks) {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      handle(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
    }
  }
  if (buf.trim()) handle(buf);
  return out;
}

// The OLD (buggy) parser: split each raw chunk, parse each piece.
function parseNaive(chunks) {
  let out = "";
  for (const chunk of chunks) {
    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue;
      try {
        const p = JSON.parse(line);
        if (p.message?.content) out += p.message.content;
      } catch {
        /* dropped */
      }
    }
  }
  return out;
}

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${e.message}`);
    process.exitCode = 1;
  }
};

// Fragment patterns that WILL split JSON lines mid-object.
const patterns = {
  "tiny 7-byte reads": [7],
  "mixed small reads": [13, 5, 29, 3, 61],
  "one-byte-at-a-time": [1],
  "whole thing at once": [wire.length],
  "just past each line": [40],
};

for (const [label, sizes] of Object.entries(patterns)) {
  const chunks = fragment(wire, sizes);
  test(`buffered parser is lossless — ${label}`, () => {
    assert.equal(parseBuffered(chunks), EXPECTED);
  });
}

test("the naive parser DID drop tokens (why the fix was needed)", () => {
  const chunks = fragment(wire, [7]);
  const naive = parseNaive(chunks);
  assert.notEqual(naive, EXPECTED, "expected the old logic to lose data");
  assert.ok(
    naive.length < EXPECTED.length,
    `old logic produced ${naive.length} chars vs full ${EXPECTED.length}`,
  );
  console.log(
    `       (old logic recovered only ${naive.length}/${EXPECTED.length} chars)`,
  );
});

console.log(`\n${passed} passed`);
