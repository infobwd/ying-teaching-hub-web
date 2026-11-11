/* Truth Table Lab UI. Pure browser-side practice, no personal data or API calls. */
import { makeTruthTable, operatorResult } from "./logic-engine.mjs";

const $ = id => document.getElementById(id);
const demoOperator = $("demoOperator");
const demoP = $("demoP");
const demoQ = $("demoQ");
const expressionInput = $("expressionInput");
const form = $("builderForm");

function setTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("themeToggle").textContent = dark ? "☀" : "☾";
  $("themeToggle").setAttribute("aria-pressed", String(dark));
  $("themeToggle").setAttribute("aria-label", dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด");
  try { localStorage.setItem("ying-theme", theme); } catch (_) {}
}
let savedTheme;
try { savedTheme = localStorage.getItem("ying-theme"); } catch (_) {}
const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
setTheme(["dark", "light"].includes(savedTheme) ? savedTheme : preferred);
$("themeToggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

function cell(tag, value, className = "") {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function renderTable(target, headings, rows, selectedRow = -1) {
  const thead = document.createElement("thead");
  const header = document.createElement("tr");
  headings.forEach((col, index) => {
    const th = cell("th", col.label, col.kind === "final" ? "is-final" : "");
    th.scope = "col";
    header.append(th);
  });
  thead.append(header);
  const tbody = document.createElement("tbody");
  rows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    if (rowIndex === selectedRow) tr.classList.add("is-selected");
    row.values.forEach((value, colIndex) => {
      const last = headings[colIndex].kind === "final";
      tr.append(cell("td", value, (value === "T" ? "is-true" : "is-false") + (last ? " is-final" : "")));
    });
    tbody.append(tr);
  });
  const caption = document.createElement("caption");
  caption.className = "visually-hidden";
  caption.textContent = "ตารางแสดงค่าความจริงทุกกรณี";
  target.replaceChildren(caption, thead, tbody);
}

const explanations = {
  "∧": "ประพจน์ 'และ' เป็นจริงเมื่อ p และ q เป็นจริงพร้อมกันเท่านั้น",
  "∨": "ประพจน์ 'หรือ' เป็นจริงเมื่อมีอย่างน้อยหนึ่งประพจน์เป็นจริง รวมกรณีที่จริงทั้งคู่",
  "→": "ประพจน์ 'ถ้า p แล้ว q' เป็นเท็จเฉพาะเมื่อ p เป็นจริง แต่ q เป็นเท็จ",
  "↔": "ประพจน์ 'ก็ต่อเมื่อ' เป็นจริงเมื่อ p และ q มีค่าความจริงตรงกัน",
  "~": "นิเสธของ p จะเปลี่ยนค่าความจริงจาก T เป็น F หรือจาก F เป็น T"
};
function updateDemo() {
  const operator = demoOperator.value;
  const p = demoP.value === "T";
  const q = demoQ.value === "T";
  const unary = operator === "~";
  demoQ.disabled = unary;
  $("demoQLabel").classList.toggle("is-disabled", unary);
  $("demoExpression").textContent = unary ? "~p" : "p " + operator + " q";
  const answer = operatorResult(operator, p, q);
  $("demoAnswer").textContent = answer ? "T" : "F";
  $("demoAnswer").classList.toggle("is-false", !answer);
  $("demoExplanation").textContent = explanations[operator];
  const cases = unary ?
    [{ p: true, q: true }, { p: false, q: false }] :
    [{ p: true, q: true }, { p: true, q: false }, { p: false, q: true }, { p: false, q: false }];
  const columns = unary ?
    [{ label: "p", kind: "variable" }, { label: "~p", kind: "final" }] :
    [{ label: "p", kind: "variable" }, { label: "q", kind: "variable" }, { label: "p " + operator + " q", kind: "final" }];
  const rows = cases.map(item => {
    const result = operatorResult(operator, item.p, item.q) ? "T" : "F";
    return { values: unary ?
      [item.p ? "T" : "F", result] :
      [item.p ? "T" : "F", item.q ? "T" : "F", result] };
  });
  const selectedRow = cases.findIndex(item => item.p === p && (unary || item.q === q));
  renderTable($("demoTable"), columns, rows, selectedRow);
}
[demoOperator, demoP, demoQ].forEach(el => el.addEventListener("change", updateDemo));
updateDemo();

function buildResults(focus = false) {
  const error = $("expressionError");
  error.hidden = true;
  expressionInput.removeAttribute("aria-invalid");
  try {
    const table = makeTruthTable(expressionInput.value);
    $("results").hidden = false;
    $("rowCount").textContent = table.rows.length + " แถว";
    $("resultFormula").textContent = table.expression;
    renderTable($("resultTable"), table.columns, table.rows);
    const kinds = {
      tautology: ["สัจนิรันดร์", "คอลัมน์สุดท้ายเป็นจริงครบทุกกรณี"],
      contradiction: ["ข้อขัดแย้ง", "คอลัมน์สุดท้ายเป็นเท็จครบทุกกรณี"],
      contingency: ["มีทั้งค่าจริงและเท็จ", "คอลัมน์สุดท้ายมีทั้ง T และ F"]
    };
    const [title, description] = kinds[table.classification];
    $("resultType").textContent = title;
    $("resultSummary").textContent = description + " — จริง " + table.trueRows + " แถว, เท็จ " + table.falseRows + " แถว";
    const stages = $("resultStages");
    stages.replaceChildren();
    const steps = table.columns.filter(col => col.kind !== "variable");
    if (!steps.length) stages.append(cell("li", "อ่านค่าตัวแปร " + table.variables.join(", ") + " ได้โดยตรง"));
    else steps.forEach((col, index) => stages.append(cell("li", (index === steps.length - 1 ? "ผลสุดท้าย: " : "ประพจน์ย่อย: ") + col.label)));
    if (focus) $("results").focus({ preventScroll: false });
  } catch (err) {
    $("results").hidden = true;
    error.textContent = err instanceof Error ? err.message : "ไม่สามารถสร้างตารางได้ กรุณาตรวจประพจน์";
    error.hidden = false;
    expressionInput.setAttribute("aria-invalid", "true");
    if (focus) expressionInput.focus();
  }
}

form.addEventListener("submit", event => { event.preventDefault(); buildResults(true); });
document.querySelectorAll("[data-example]").forEach(button => {
  button.addEventListener("click", () => {
    expressionInput.value = button.dataset.example;
    buildResults(false);
    expressionInput.focus();
  });
});
document.querySelectorAll("[data-insert]").forEach(button => {
  button.addEventListener("click", () => {
    const start = expressionInput.selectionStart ?? expressionInput.value.length;
    const end = expressionInput.selectionEnd ?? expressionInput.value.length;
    expressionInput.setRangeText(button.dataset.insert, start, end, "end");
    expressionInput.focus();
  });
});
$("deleteSymbol").addEventListener("click", () => {
  const start = expressionInput.selectionStart ?? expressionInput.value.length;
  const end = expressionInput.selectionEnd ?? start;
  expressionInput.setRangeText("", start === end ? Math.max(0, start - 1) : start, end, "end");
  expressionInput.focus();
});
$("resetExpression").addEventListener("click", () => {
  expressionInput.value = "";
  $("expressionError").hidden = true;
  expressionInput.removeAttribute("aria-invalid");
  $("results").hidden = true;
  expressionInput.focus();
});
buildResults(false);
