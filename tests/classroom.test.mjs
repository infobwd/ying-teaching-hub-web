import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const page = read("classroom/index.html");
const logic = read("classroom/classroom.js");
const css = read("classroom/classroom.css");
const home = read("index.html");
const catalog = JSON.parse(read("data/public-materials.json"));
const outline = JSON.parse(read("data/public-math-outline.json"));

assert.match(page, /<html lang="th">/);
for (const section of ["room", "lessons", "materials", "activities", "account"]) {
  assert.ok(page.includes('id="' + section + '"'), "missing section " + section);
}
for (const asset of ["./classroom.js", "./classroom.css", "../assets/mark.svg"]) {
  assert.ok(page.includes(asset), "missing linked asset " + asset);
}
assert.ok(home.includes('href="./classroom/"'), "homepage must link to classroom");
assert.ok(page.includes("data-course=\"m2\"") && page.includes("data-course=\"m4\""));
assert.ok(page.includes("logic/truth-table.html") && page.includes("games/logic-equivalence/"));
assert.match(page, /form-action 'none'/);
assert.doesNotMatch(page, /\son(?:click|change|load|submit)\s*=/i, "inline event handler unsafe");
assert.doesNotMatch(page, /<script(?![^>]+src=)/i, "inline scripts unsafe");
assert.doesNotMatch(page, /<style\b/i, "inline styles unsafe");
assert.doesNotMatch(logic, /(?:localStorage|sessionStorage|supabase|service_role|anon_key|student_id|student_name)/i, "public classroom must not store/access private student data");
assert.ok(logic.includes("PUBLIC_OUTLINE_ONLY"), "must validate public outline scope");
assert.ok(logic.includes('approval_status === "approved"'), "must filter approval");
assert.ok(logic.includes('publication_state === "published"'), "must filter publication");
assert.equal(catalog.schema_version, 1);
assert.ok(Array.isArray(catalog.materials));
assert.equal(outline.publication_scope, "PUBLIC_OUTLINE_ONLY");
assert.deepEqual(outline.courses.map((item) => item.id), ["m2", "m4"]);
assert.ok(css.includes("safe-area-inset-bottom"), "mobile safe area should be respected");
console.log("PASS: Ying Classroom public-only layout, safe links and course-selection contract");
