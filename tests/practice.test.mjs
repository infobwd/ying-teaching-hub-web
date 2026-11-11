import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PRACTICE_LEVELS, PUBLIC_PRACTICE, createExercise,
  levelQuestions, targetKey, gradeExercise, diagnose } from "../logic/practice-engine.mjs";

const expected = {
  B1: "FTFF", B2: "TFTT", B3: "FTTF",
  M1: "FTTT", M2: "FFTF", M3: "TTTT",
  A1: "TTTFTTTT", A2: "TFTFTFFT", A3: "TFTTTFTF"
};
assert.deepEqual(PRACTICE_LEVELS.map(x => x.id), ["basic","intermediate","advanced"]);
assert.equal(PUBLIC_PRACTICE.length, 9, "Phase C must have three exercises per level");
assert.equal(new Set(PUBLIC_PRACTICE.map(x => x.id)).size, 9, "duplicate practice IDs");
for (const level of PRACTICE_LEVELS) {
  assert.equal(levelQuestions(level.id).length, 3);
  for (const item of levelQuestions(level.id)) {
    assert.equal(item.level, level.id);
    const ex = createExercise(item.id);
    assert.equal(ex.table.rows.length, Math.pow(2, ex.table.variables.length));
    assert.equal(ex.table.rows.map(row => row.values.at(-1)).join(""), expected[item.id], "truth values " + item.id);
    assert.equal(ex.maxScore, ex.targetColumns.length * ex.table.rows.length);
    if (level.id === "basic") assert.deepEqual(ex.targetColumns, [ex.table.columns.length - 1]);
    if (level.id === "intermediate") {
      assert.ok(ex.targetColumns.every(colIndex => ex.table.columns[colIndex].kind !== "variable"));
    }
    if (level.id === "advanced") assert.equal(ex.targetColumns.length, ex.table.columns.length);

    const empty = gradeExercise(ex);
    assert.equal(empty.total, ex.maxScore);
    assert.equal(empty.correct, 0);
    assert.equal(empty.unanswered, ex.maxScore);
    assert.equal(empty.complete, false);
    const full = {};
    for (let ri = 0; ri < ex.table.rows.length; ri++) {
      for (const ci of ex.targetColumns) full[targetKey(ri, ci)] = ex.table.rows[ri].values[ci];
    }
    const perfect = gradeExercise(ex, full);
    assert.equal(perfect.complete, true);
    assert.equal(perfect.correct, ex.maxScore);
    assert.equal(perfect.firstError, null);

    const bad = { ...full };
    const firstKey = targetKey(0, ex.targetColumns[0]);
    bad[firstKey] = full[firstKey] === "T" ? "F" : "T";
    const graded = gradeExercise(ex, bad);
    assert.equal(graded.complete, true);
    assert.equal(graded.correct, ex.maxScore - 1);
    assert.equal(graded.firstError.row, 1);
    assert.equal(graded.firstError.expected, full[firstKey]);
    assert.ok(graded.firstError.explanation.length > 10);
    assert.equal(gradeExercise(ex, { [firstKey]: "?" }).unanswered, ex.maxScore);
  }
}
assert.equal(diagnose(createExercise("B1"),0,2).column, "p ∧ ~q");
assert.equal(diagnose(createExercise("A1"),0,0).column, "p");
assert.throws(() => createExercise("UNKNOWN"), /ไม่พบ/);
assert.throws(() => levelQuestions("UNKNOWN"), /ระดับ/);
assert.throws(() => targetKey(-1,0), /ตำแหน่ง/);
assert.throws(() => diagnose(createExercise("B1"),50,1), /ตำแหน่ง/);

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const html = read("logic/truth-table.html");
const js = read("logic/practice.js");
const engine = read("logic/practice-engine.mjs");
const css = read("logic/truth-table.css");
const oldTests = read("tests/truth-table.test.mjs");
assert.ok(oldTests.includes("makeTruthTable"), "A–B regression tests must remain");
for (const id of ["practiceLevels","practiceQuestion","practiceTable","practiceFeedback",
  "practiceCheck","practiceReset","practiceNext","practiceHint"]) {
  assert.ok(html.includes('id="' + id + '"'), "missing practice UI: " + id);
}
assert.ok(html.includes('src="./practice.js"'));
assert.ok(html.includes('href="#practice"'));
assert.ok(css.includes(".practice-cell"));
assert.ok(js.includes("gradeExercise(current, answers)"));
assert.doesNotMatch(html, /\son(?:click|change|load|submit)\s*=/i, "inline handlers forbidden");
assert.doesNotMatch(js + engine, /\beval\s*\(|\bnew\s+Function\b|\.innerHTML\s*=/);
assert.doesNotMatch(js + engine, /supabase|fetch\s*\(|localStorage|sessionStorage/i,
  "formative results must not be saved remotely or persistently");
assert.doesNotMatch(JSON.stringify(PUBLIC_PRACTICE), /student_name|student_id|score_id|service_role/i);
console.log("PASS Phase C: 9 public practice expressions, three levels, cell scoring, feedback, keyboard-ready controls and privacy checks.");
