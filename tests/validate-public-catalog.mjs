import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const catalog = JSON.parse(read("data/public-materials.json"));
assert.equal(catalog.schema_version, 1, "unsupported catalog schema");
assert.ok(Array.isArray(catalog.materials), "materials must be an array");

const ids = new Set();
const fields = ["id","title","description","workspace_type","level","subject","version","file_url","visibility","approval_status","publication_state","approved_at"];
for (const [n, item] of catalog.materials.entries()) {
  const label = "materials[" + n + "]";
  assert.equal(typeof item, "object", label);
  for (const key of fields) assert.ok(typeof item[key] === "string" && item[key].trim(), label + " missing " + key);
  assert.ok(!ids.has(item.id), label + " duplicate id");
  ids.add(item.id);
  assert.ok(["school", "tutoring"].includes(item.workspace_type), label + " workspace invalid");
  assert.equal(item.visibility, "PUBLIC_APPROVED", label + " contains private or nonapproved content");
  assert.equal(item.approval_status, "approved", label + " not approved");
  assert.equal(item.publication_state, "published", label + " not published");
  assert.match(item.file_url, /^https:\/\//, label + " URL must use HTTPS");
  const parsed = new URL(item.file_url);
  assert.ok(parsed.hostname, label + " missing host");
  assert.match(item.approved_at, /^\d{4}-\d{2}-\d{2}$/, label + " approval date required");
  const values = JSON.stringify(item);
  assert.ok(!/\b(?:password|access_token|client_secret|private_key|api_secret)\b/i.test(values), label + " seems to include a secret field");
}

const html = read("index.html");
assert.ok(html.includes('lang="th"'), "Thai language marker missing");
assert.ok(html.includes('id="materialGrid"'), "catalog mount missing");
assert.ok(html.includes('id="themeToggle"'), "theme toggle missing");
assert.ok(html.includes('href="./styles.css"') && html.includes('src="./app.js"'), "static assets not linked");
assert.doesNotMatch(html, /\son(?:click|change|load|submit)\s*=/i, "inline handlers prohibited");
console.log("PASS: public catalog and static shell checks; " + catalog.materials.length + " approved records.");
