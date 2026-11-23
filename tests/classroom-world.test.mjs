import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const get = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const html = get("classroom/world/index.html");
const js = get("classroom/world/world.js");
const css = get("classroom/world/world.css");
const entry = get("classroom/index.html");
assert.match(html, /<html lang="th">/);
assert.match(html, /content="default-src 'self'; script-src 'self'/);
assert.match(html, /form-action 'none'/);
assert.ok(entry.includes('href="./world/"'), "public classroom should link to 3D world");
for (const asset of ["./world.css", "./world.js", "../../assets/mark.svg"]) {
  assert.ok(html.includes(asset), "missing world asset " + asset);
}
for (const id of ["roomCanvas", "viewport", "hotspotLesson", "hotspotGame", "hotspotScore", "changeAvatar", "lessonLink", "gameLink", "scoreButton", "notice"]) {
  assert.ok(html.includes('id="' + id + '"'), "missing interactive element: " + id);
}
assert.match(html, /data-level="m2"/);
assert.match(html, /data-level="m4"/);
assert.ok(js.includes("pointermove") && js.includes("project(p)"), "world must support orbiting 3D geometry");
assert.ok(js.includes("faces.sort(") && js.includes("ctx.fill()"), "world must depth-render original geometric faces");
assert.ok(js.includes("showNotice("), "locked scorebook must not masquerade as live grades");
assert.ok(js.includes("../../math.html#m4-h1"));
assert.ok(js.includes("../../math.html#m2-h1"));
assert.ok(js.includes("../../games/logic-equivalence/"));
assert.doesNotMatch(html, /\son(?:click|load|change|submit)\s*=/i, "no inline event handlers");
assert.doesNotMatch(html, /<script(?![^>]+src=)/i, "no inline JS");
assert.doesNotMatch(js + html, /(?:localStorage|sessionStorage|supabase|service_role|secret_key|student_id|student_name|password\s*:)/i, "preview must not collect student identity, login, or grades");
assert.ok(css.includes("safe") || css.includes("max-width:740px"), "responsive mobile rules required");
console.log("PASS: 3D classroom has original interactive geometry, safe preview, local navigation and responsive controls");
