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


const outlines = JSON.parse(read("data/public-math-outline.json"));
assert.equal(outlines.schema_version, 1);
assert.equal(outlines.publication_scope, "PUBLIC_OUTLINE_ONLY");
assert.ok(Array.isArray(outlines.courses));
assert.equal(outlines.courses.length, 2, "Only the two curated example courses should be public");
assert.deepEqual(outlines.courses.map(x => x.id), ["m2", "m4"]);
assert.deepEqual(outlines.courses.map(x => x.planned_hours), [6, 20]);

const allowedRoot = ["schema_version", "publication_scope", "updated_on", "note", "courses"];
const allowedCourse = ["id", "grade", "subject", "unit", "title", "planned_hours", "description", "curriculum_state", "student_files_published", "assessment_note", "lessons"];
const allowedLesson = ["hour", "title", "focus", "guide", "stage", "material_state"];
assert.deepEqual(Object.keys(outlines).sort(), allowedRoot.sort(), "Outline JSON contains unexpected root keys");
for (const course of outlines.courses) {
  assert.ok(Object.keys(course).every(key => allowedCourse.includes(key)), course.id + " has unexpected/private keys");
  assert.equal(course.curriculum_state, "working_outline");
  assert.equal(course.student_files_published, 0);
  assert.equal(course.grade, course.id === "m2" ? "ม.2" : "ม.4");
  assert.equal(course.lessons.length, course.planned_hours);
  for (const [index, lesson] of course.lessons.entries()) {
    assert.deepEqual(Object.keys(lesson).filter(key => !allowedLesson.includes(key)), [], course.id + " includes unexpected lesson data");
    assert.equal(lesson.hour, index + 1, course.id + " has a gap/duplicate lesson hour");
    assert.equal(lesson.stage, "planning");
    assert.equal(lesson.material_state, "not_published", "No unapproved files should be claimed as published");
    for (const field of ["title", "focus"]) assert.ok(typeof lesson[field] === "string" && lesson[field].trim().length > 4);
  }
}
const mathPage = read("math.html");
assert.match(mathPage, /<html lang="th">/);
for (const id of ["courseChooser", "courseContent", "lessonList", "lessonDetail", "selectedLessonTitle", "prevLesson", "nextLesson"]) {
  assert.ok(mathPage.includes('id="' + id + '"'), "Math page missing " + id);
}
assert.ok(mathPage.includes('src="./math.js"'));
assert.ok(mathPage.includes('href="./math.css"'));
assert.doesNotMatch(mathPage, /\son(?:click|change|load|submit)\s*=/i, "Inline handlers prohibited");
assert.ok(html.includes('href="./math.html"'), "Home must link to math page");
assert.ok(read("math.js").includes("PUBLIC_OUTLINE_ONLY"));
console.log("PASS: safe M2/M4 public math outline checks (6 + 20 hours).");
