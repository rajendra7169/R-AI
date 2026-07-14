/**
 * Runtime tests for the chat UX logic in Shared/ui-src/app.js.
 *
 * app.js is written for the browser and calls init() on load, so we run it
 * inside a vm sandbox behind a permissive DOM shim: every element is a Proxy
 * that absorbs whatever the app does to it. That lets the real, unmodified
 * source load, after which we drive the exported functions directly.
 *
 * Run: node tests/ui_logic.test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, "..", "Shared", "ui-src", "app.js");

// ── A DOM element that tolerates any access ────────────────────────────────
function stubEl(id = "") {
  const el = {
    id,
    value: "",
    innerHTML: "",
    textContent: "",
    hidden: false,
    style: {},
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains: () => false,
    },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute: () => null,
    removeAttribute() {},
    appendChild() {},
    remove() {},
    click() {},
    focus() {},
    blur() {},
    setSelectionRange() {},
    querySelector: () => stubEl(),
    querySelectorAll: () => [],
    closest: () => stubEl(),
    scrollHeight: 0,
    lastElementChild: null,
  };
  return el;
}

const els = new Map();
const byId = (id) => {
  if (!els.has(id)) els.set(id, stubEl(id));
  return els.get(id);
};

const downloads = [];

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  Math,
  Date,
  JSON,
  Number,
  Array,
  Object,
  String,
  Promise,
  URL: {
    createObjectURL: () => "blob:stub",
    revokeObjectURL: () => {},
  },
  Blob: class {
    constructor(parts) {
      this.parts = parts;
      downloads.push(String(parts[0]));
    }
  },
  fetch: () => Promise.reject(new Error("network disabled in tests")),
  localStorage: {
    _d: {},
    getItem(k) {
      return this._d[k] ?? null;
    },
    setItem(k, v) {
      this._d[k] = String(v);
    },
  },
  location: { protocol: "file:" },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  window: { innerWidth: 1400, addEventListener() {} },
  document: {
    documentElement: stubEl("html"),
    body: stubEl("body"),
    querySelector: (s) => byId(s.replace(/^#/, "")),
    querySelectorAll: () => [],
    getElementById: (id) => byId(id),
    // esc() escapes by assigning textContent and reading innerHTML back, so
    // the stub has to emulate that round-trip or every escape silently
    // yields "" and the escaping tests pass vacuously.
    createElement: () => {
      const el = stubEl();
      let text = "";
      Object.defineProperty(el, "textContent", {
        get: () => text,
        set(v) {
          text = String(v);
          el.innerHTML = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        },
      });
      return el;
    },
    addEventListener() {},
  },
};
sandbox.globalThis = sandbox;
sandbox.window.localStorage = sandbox.localStorage;

// Swallow the async failures init() produces once fetch() rejects; we only
// need the function declarations it leaves behind on the sandbox.
process.on("unhandledRejection", () => {});

vm.createContext(sandbox);
vm.runInContext(readFileSync(APP, "utf8"), sandbox, { filename: "app.js" });

// ── Helpers ───────────────────────────────────────────────────────────────
// `const S = {...}` is a lexical declaration, so it lives in the context's
// global lexical environment rather than on the sandbox object. Reach it by
// evaluating in the same context. (Function declarations *do* land on the
// sandbox, so sandbox.forkFrom and friends are directly callable.)
const S = vm.runInContext("S", sandbox);

// regenerate() and saveEdit() truncate the history and then hand off to
// streamOllama(), which immediately appends a placeholder assistant message.
// Stub it out so these tests observe the truncation itself rather than the
// state after the next turn has already been staged.
let streamCalls = 0;
sandbox.streamOllama = () => {
  streamCalls++;
  return Promise.resolve();
};
let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
};

const conv = (over = {}) => ({
  id: "c1",
  title: "Rocket science",
  ts: 1,
  model: "m",
  sys: "",
  msgs: [
    { id: "m1", role: "user", content: "how do rockets work", displayContent: "how do rockets work" },
    { id: "m2", role: "assistant", content: "Thrust comes from expelling mass." },
    { id: "m3", role: "user", content: "what about orbits" },
    { id: "m4", role: "assistant", content: "An orbit is a stable free fall." },
  ],
  ...over,
});

const reset = (c = conv()) => {
  S.convs = [c];
  S.curId = c.id;
  S.streaming = false;
  S.editing = null;
  S.search = "";
  streamCalls = 0;
  return c;
};

// ── Search ────────────────────────────────────────────────────────────────
test("search matches on chat title", () => {
  const c = reset();
  assert.equal(sandbox.convMatches(c, "rocket"), true);
});

test("search matches on message body, not just title", () => {
  const c = reset();
  assert.equal(sandbox.convMatches(c, "free fall"), true);
  assert.equal(sandbox.convMatches(c, "photosynthesis"), false);
});

test("search snippet marks the hit and escapes HTML", () => {
  const c = reset(
    conv({
      msgs: [{ id: "m1", role: "user", content: "<img onerror=x> orbits", displayContent: "<img onerror=x> orbits" }],
    }),
  );
  const snip = sandbox.searchSnippet(c, "orbits");
  assert.ok(snip.includes("<mark>orbits</mark>"), "hit is marked");
  assert.ok(!snip.includes("<img"), "raw HTML must be escaped, got: " + snip);
  assert.ok(snip.includes("&lt;img"), "angle brackets escaped");
});

// ── Branch ────────────────────────────────────────────────────────────────
test("forkFrom copies history up to and including the chosen message", () => {
  const c = reset();
  sandbox.forkFrom(1); // through the first assistant reply
  assert.equal(S.convs.length, 2);
  const fork = S.convs[0];
  assert.equal(fork.msgs.length, 2);
  assert.equal(fork.msgs[1].id, "m2");
  assert.equal(fork.title, "Rocket science (branch)");
  assert.notEqual(fork.id, c.id);
});

test("forkFrom deep-copies so edits do not leak back to the original", () => {
  const c = reset();
  sandbox.forkFrom(0);
  S.convs[0].msgs[0].content = "MUTATED";
  assert.equal(c.msgs[0].content, "how do rockets work");
});

test("forkFrom does not stack '(branch)' suffixes", () => {
  reset(conv({ title: "Rocket science (branch)" }));
  sandbox.forkFrom(0);
  assert.equal(S.convs[0].title, "Rocket science (branch)");
});

// ── Regenerate ────────────────────────────────────────────────────────────
test("regenerate drops trailing assistant turns, keeping the last user message", () => {
  const c = reset();
  sandbox.regenerate();
  assert.deepEqual(
    c.msgs.map((m) => m.id),
    ["m1", "m2", "m3"],
    "the final assistant reply is removed so it can be re-answered",
  );
  assert.equal(streamCalls, 1, "and the model is asked again");
});

test("regenerate is a no-op while streaming", () => {
  const c = reset();
  S.streaming = true;
  sandbox.regenerate();
  assert.equal(c.msgs.length, 4);
  assert.equal(streamCalls, 0);
});

// ── Edit ──────────────────────────────────────────────────────────────────
test("saveEdit rewrites the message and truncates everything after it", () => {
  const c = reset();
  byId("edit-ta").value = "what about re-entry";
  sandbox.saveEdit("m1");
  assert.equal(c.msgs.length, 1, "later turns describe a conversation that no longer happened");
  assert.equal(c.msgs[0].content, "what about re-entry");
  assert.equal(c.msgs[0].displayContent, "what about re-entry");
  assert.equal(c.title, "what about re-entry", "editing the first message retitles the chat");
  assert.equal(streamCalls, 1, "and the model re-answers from the edited turn");
  assert.equal(S.editing, null, "editor closes");
});

test("saveEdit preserves attached-document context in front of the prompt", () => {
  const c = reset(
    conv({
      msgs: [
        {
          id: "m1",
          role: "user",
          content: 'Attached document context:\n\nDocument 1: "a.pdf"\n\nBODY\n\n---\nUser: summarise',
          displayContent: "summarise",
        },
      ],
    }),
  );
  byId("edit-ta").value = "summarise in one line";
  sandbox.saveEdit("m1");
  assert.ok(c.msgs[0].content.startsWith("Attached document context:"), "doc context kept");
  assert.ok(c.msgs[0].content.endsWith("\n\n---\nUser: summarise in one line"), "prompt swapped");
  assert.equal(c.msgs[0].displayContent, "summarise in one line");
});

test("saveEdit ignores an empty edit", () => {
  const c = reset();
  byId("edit-ta").value = "   ";
  sandbox.saveEdit("m1");
  assert.equal(c.msgs.length, 4);
});

// ── Export ────────────────────────────────────────────────────────────────
test("exportChat emits Markdown with both speakers and the model", () => {
  reset();
  downloads.length = 0;
  sandbox.exportChat();
  assert.equal(downloads.length, 1);
  const md = downloads[0];
  assert.ok(md.startsWith("# Rocket science"), "title heading");
  assert.ok(md.includes("**Model:** m"), "model recorded");
  assert.ok(md.includes("## You"), "user turns");
  assert.ok(md.includes("## R-AI"), "assistant turns");
  assert.ok(md.includes("An orbit is a stable free fall."), "final answer present");
});

test("exportChat writes nothing for an empty conversation", () => {
  reset(conv({ msgs: [] }));
  downloads.length = 0;
  sandbox.exportChat();
  assert.equal(downloads.length, 0);
});

console.log(`\n${passed} passed`);
