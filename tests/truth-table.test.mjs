import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { makeTruthTable, tokenize, parseExpression, operatorResult } from "../logic/logic-engine.mjs";

function finalValues(expression) {
  const table = makeTruthTable(expression);
  return table.rows.map(row => row.values.at(-1)).join("");
}
const fixtures = [
  ["p", "TF"], ["q", "TF"], ["~p", "FT"],
  ["p ∧ q", "TFFF"], ["p ∨ q", "TTTF"],
  ["p → q", "TFTT"], ["p ↔ q", "TFFT"],
  ["~(p ∨ q)", "FFFT"], ["~p ∧ q", "FFTF"],
  ["(p ∧ q) → r", "TFTTTTTT"],
  ["p ∨ ~p", "TT"], ["p ∧ ~p", "FF"],
  ["(p → q) ↔ (~q → ~p)", "TTTT"],
  ["(p → q) ∧ (q → r)", "TFFFTFTT"],
  ["p -> q", "TFTT"], ["p <-> q", "TFFT"],
  ["~~p", "TF"], ["¬p", "FT"]
];
for (const [expression, expected] of fixtures) {
  assert.equal(finalValues(expression), expected, expression);
}

assert.deepEqual(makeTruthTable("p → q").rows.map(x => x.values.slice(0,2)), [
  ["T","T"], ["T","F"], ["F","T"], ["F","F"]
]);
assert.deepEqual(makeTruthTable("(p ∧ q) → r").rows.map(x => x.values.slice(0,3)), [
  ["T","T","T"], ["T","T","F"], ["T","F","T"], ["T","F","F"],
  ["F","T","T"], ["F","T","F"], ["F","F","T"], ["F","F","F"]
]);
for (const expression of ["p","p → q","(p ∧ q) → r"]) {
  const data = makeTruthTable(expression);
  assert.equal(data.rows.length, 2 ** data.variables.length);
  assert.ok(data.rows.every(r => r.values.length === data.columns.length));
}
assert.equal(makeTruthTable("p ∨ ~p").classification, "tautology");
assert.equal(makeTruthTable("p ∧ ~p").classification, "contradiction");
assert.equal(makeTruthTable("p → q").classification, "contingency");
assert.deepEqual(makeTruthTable("(p ∧ q) → r").columns.map(c => c.label), [
  "p","q","r","p ∧ q","(p ∧ q) → r"
]);
assert.equal(operatorResult("→", true, false), false);
assert.equal(operatorResult("∨", true, true), true);
assert.equal(operatorResult("~", false, true), true);
assert.deepEqual(tokenize("p->q"), ["p","→","q"]);
assert.equal(parseExpression("p ↔ q").type, "iff");

for (const expression of [
  "", "p ∧", "p q", "(p ∨ q", "p ∧ s", "p / q",
  "p ∧ ∨ q", "p)", "(".repeat(25)+"p"+")".repeat(25),
  "p".repeat(121)
]) {
  assert.throws(() => makeTruthTable(expression), Error, "Expected invalid: " + expression);
}

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const html = read("logic/truth-table.html");
const script = read("logic/truth-table.js");
const engine = read("logic/logic-engine.mjs");
const map = read("math.html");
for (const key of ["demoOperator","demoP","demoQ","builderForm","expressionInput","resultTable","expressionError"]) {
  assert.ok(html.includes('id="' + key + '"'), "Missing interactive field " + key);
}
assert.ok(html.includes('type="module" src="./truth-table.js"'));
assert.ok(html.includes('href="./truth-table.css"'));
assert.ok(map.includes('id="truthTableLabLink"'));
assert.ok(read("math.js").includes("truthTableLabLink"));
assert.doesNotMatch(html, /\son(?:click|change|load|submit)\s*=/i);
assert.doesNotMatch(script + engine, /\beval\s*\(|\bnew\s+Function\b/);
assert.ok(!html.includes("service_role") && !script.includes("supabaseUrl"));
console.log("PASS: " + fixtures.length + " logical fixtures, row ordering, AST substeps, input safety and public UI checks.");
