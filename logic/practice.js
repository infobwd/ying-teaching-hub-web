/* Phase C interactive practice — all attempts remain in the current page only. */
import { PRACTICE_LEVELS, createExercise, levelQuestions, targetKey, gradeExercise } from "./practice-engine.mjs";

const $ = id => document.getElementById(id);
let selectedLevel = "basic";
let selectedIndex = 0;
let current = null;
let answers = {};
let lastGrade = null;
const buttons = [...document.querySelectorAll("[data-level]")];

function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

function markCells() {
  const statuses = lastGrade?.complete ? new Map(lastGrade.details.map(result => [result.key, result.correct])) : new Map();
  for (const control of document.querySelectorAll("#practiceTable [data-practice-cell]")) {
    const key = targetKey(Number(control.dataset.row), Number(control.dataset.column));
    const mark = statuses.get(key);
    control.classList.toggle("is-correct", mark === true);
    control.classList.toggle("is-incorrect", mark === false);
    control.setAttribute("aria-invalid", mark === false ? "true" : "false");
  }
}

function renderPracticeTable() {
  const thead = element("thead");
  const hrow = element("tr");
  current.table.columns.forEach((col, ci) => {
    const th = element("th", col.label, col.kind === "final" ? "is-final" : "");
    th.scope = "col";
    hrow.append(th);
  });
  thead.append(hrow);
  const tbody = element("tbody");
  for (let ri = 0; ri < current.table.rows.length; ri++) {
    const row = current.table.rows[ri];
    const tr = element("tr");
    row.values.forEach((value, ci) => {
      const td = element("td");
      if (ci === current.table.columns.length - 1) td.classList.add("is-final");
      if (current.targetColumns.includes(ci)) {
        const key = targetKey(ri, ci);
        const chosen = answers[key] || null;
        const button = element("button", chosen || "—", "practice-cell");
        button.type = "button";
        button.dataset.practiceCell = "true";
        button.dataset.row = String(ri);
        button.dataset.column = String(ci);
        button.dataset.key = key;
        button.setAttribute("aria-label",
          "แถวที่ " + (ri + 1) + " คอลัมน์ " + current.table.columns[ci].label +
          " ค่า " + (chosen || "ยังไม่ตอบ") + " กดเพื่อเปลี่ยนเป็น T, F หรือว่าง");
        if (chosen) button.classList.add(chosen === "T" ? "is-true" : "is-false");
        td.append(button);
      } else {
        td.textContent = value;
        td.classList.add(value === "T" ? "is-true" : "is-false", "practice-given");
      }
      tr.append(td);
    });
    tbody.append(tr);
  }
  const caption = element("caption", "แบบฝึกตารางค่าความจริง กรุณาเติมช่องว่างให้ครบ", "visually-hidden");
  $("practiceTable").replaceChildren(caption, thead, tbody);
  markCells();
}

function clearFeedback() {
  lastGrade = null;
  $("practiceFeedback").hidden = true;
  $("practiceFeedbackTitle").textContent = "";
  $("practiceFeedbackDetail").textContent = "";
}
function feedback(title, detail, kind = "info") {
  const container = $("practiceFeedback");
  container.hidden = false;
  container.dataset.result = kind;
  $("practiceFeedbackTitle").textContent = title;
  $("practiceFeedbackDetail").textContent = detail;
  container.focus({ preventScroll: false });
}

function setExercise() {
  const exercises = levelQuestions(selectedLevel);
  selectedIndex = Math.max(0, Math.min(selectedIndex, exercises.length - 1));
  current = createExercise(exercises[selectedIndex].id);
  answers = {};
  clearFeedback();
  $("practiceHintText").hidden = true;
  $("practiceHintText").textContent = "";
  buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.level === selectedLevel)));
  const level = PRACTICE_LEVELS.find(record => record.id === selectedLevel);
  $("practiceInstruction").textContent = level.description + " · กดช่องว่างเพื่อเลือก T → F → ว่าง";
  $("practiceProgress").textContent = "โจทย์ " + (selectedIndex + 1) + " จาก " + exercises.length + " · " + level.label;
  $("practiceTitle").textContent = current.title;
  $("practiceFormula").textContent = current.expression;
  $("practiceQuestion").replaceChildren(...exercises.map((item, i) => {
    const option = element("option", "ข้อ " + (i + 1) + " · " + item.title);
    option.value = String(i);
    return option;
  }));
  $("practiceQuestion").value = String(selectedIndex);
  $("practiceNext").disabled = selectedIndex === exercises.length - 1;
  renderPracticeTable();
}

document.querySelector("#practiceLevels").addEventListener("click", event => {
  const button = event.target.closest("[data-level]");
  if (!button || !PRACTICE_LEVELS.some(level => level.id === button.dataset.level)) return;
  selectedLevel = button.dataset.level;
  selectedIndex = 0;
  setExercise();
});

$("practiceQuestion").addEventListener("change", event => {
  const index = Number(event.target.value);
  if (!Number.isInteger(index) || index < 0 || index >= levelQuestions(selectedLevel).length) return;
  selectedIndex = index;
  setExercise();
});

$("practiceTable").addEventListener("click", event => {
  const button = event.target.closest("[data-practice-cell]");
  if (!button || !current || !$("practiceTable").contains(button)) return;
  const key = button.dataset.key;
  answers[key] = answers[key] === undefined ? "T" : answers[key] === "T" ? "F" : undefined;
  if (answers[key] === undefined) delete answers[key];
  clearFeedback();
  renderPracticeTable();
  const next = $("practiceTable").querySelector('[data-key="' + key + '"]');
  if (next) next.focus({ preventScroll: true });
});

$("practiceCheck").addEventListener("click", () => {
  lastGrade = gradeExercise(current, answers);
  if (!lastGrade.complete) {
    feedback("ยังเติมไม่ครบ", "เหลืออีก " + lastGrade.unanswered +
      " ช่อง ลองเติมให้ครบทุกช่องก่อนกดตรวจคำตอบ", "incomplete");
    return;
  }
  markCells();
  if (lastGrade.correct === lastGrade.total) {
    feedback("ยอดเยี่ยม! ถูกต้องทุกช่อง", "ทำได้ " + lastGrade.correct +
      "/" + lastGrade.total + " ช่อง ลองข้อต่อไปหรือเพิ่มระดับความท้าทาย", "success");
  } else {
    const wrong = lastGrade.firstError;
    feedback("ถูกต้อง " + lastGrade.correct + " จาก " + lastGrade.total + " ช่อง",
      "ช่องที่ควรทบทวนก่อน: แถว " + wrong.row + " · " + wrong.column +
      " (" + wrong.context + ") คุณควรตอบ " + wrong.expected +
      " เพราะ " + wrong.explanation + " · ปรับคำตอบแล้วตรวจอีกครั้งได้", "review");
  }
});

$("practiceHint").addEventListener("click", () => {
  const hint = $("practiceHintText");
  hint.textContent = "แนวคิด: " + current.hint;
  hint.hidden = !hint.hidden;
  if (!hint.hidden) hint.scrollIntoView({ block: "nearest", behavior: "smooth" });
});

$("practiceReset").addEventListener("click", () => {
  answers = {};
  clearFeedback();
  renderPracticeTable();
});

$("practiceNext").addEventListener("click", () => {
  const questions = levelQuestions(selectedLevel);
  if (selectedIndex < questions.length - 1) {
    selectedIndex++;
    setExercise();
  }
});

setExercise();
