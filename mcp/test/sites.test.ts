import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareSite, SiteError } from "../src/sites.ts";

const index = { path: "index.html", content: "<!doctype html><title>bot</title><h1>hello</h1>" };

test("accepts a small static site, base64 assets included", () => {
  const site = prepareSite([index, { path: "./css/site.css", content: "h1{color:red}" }, { path: "img/dot.png", content: "iVBORw0KGgo=", encoding: "base64" }]);
  assert.deepEqual(site.files.map((f) => [f.path, f.type]), [
    ["index.html", "text/html"],
    ["css/site.css", "text/css"],
    ["img/dot.png", "image/png"],
  ]);
  assert.equal(site.files[2].bytes.length, 8);
});

test("requires index.html at the root", () => {
  assert.throws(() => prepareSite([{ path: "about.html", content: "x" }]), /index.html/);
  assert.throws(() => prepareSite([]), SiteError);
});

test("rejects traversal, absolute-looking and odd paths, and duplicates", () => {
  for (const path of ["../x.html", "a/../b.html", "a//b.html", "a b.html", "c:\\x.html"]) {
    assert.throws(() => prepareSite([index, { path, content: "x" }]), SiteError, path);
  }
  assert.throws(() => prepareSite([index, index]), /twice/);
});

test("rejects non-static file types", () => {
  for (const path of ["run.sh", "app.exe", "x.php", "noext", "w.wasm"]) {
    assert.throws(() => prepareSite([index, { path, content: "x" }]), /not accepted/, path);
  }
});

test("refuses pages that collect wallet secrets", () => {
  assert.throws(() => prepareSite([{ path: "index.html", content: '<form><input type="password"></form>' }]), /password field/);
  assert.throws(
    () => prepareSite([{ path: "index.html", content: "<p>Verify your wallet</p><textarea placeholder='Enter your seed phrase'></textarea>" }]),
    /seed phrase/
  );
  // talking about keys without asking for input is fine
  assert.doesNotThrow(() => prepareSite([{ path: "index.html", content: "<p>Never share your private key.</p>" }]));
});

test("enforces the 10 MB cap", () => {
  const big = "a".repeat(10 * 1024 * 1024);
  assert.throws(() => prepareSite([index, { path: "big.txt", content: big }]), /larger than 10 MB/);
});
