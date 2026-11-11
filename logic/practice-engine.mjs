/* Phase C: public, original formative practice items only.
   NOT the private teacher-review question bank; NO personally identifiable data. */
import { makeTruthTable, parseExpression } from "./logic-engine.mjs";

export const PRACTICE_LEVELS = Object.freeze([
  { id: "basic", label: "พื้นฐาน", description: "เติมคอลัมน์คำตอบสุดท้าย โดยมีค่าตัวแปรให้แล้ว" },
  { id: "intermediate", label: "ประยุกต์", description: "เติมคอลัมน์ย่อยและคำตอบสุดท้ายให้ครบ" },
  { id: "advanced", label: "ท้าทาย", description: "สร้างค่าตัวแปรทั้งตาราง แล้วเติมทุกคอลัมน์ด้วยตนเอง" }
]);

// Each expression is an original public practice prompt. This is not a graded assessment.
export const PUBLIC_PRACTICE = Object.freeze([
  { id: "B1", level: "basic", expression: "p ∧ ~q", title: "เมื่อใดจึงจริง?", hint: "เริ่มจากการกลับค่าของ q แล้วพิจารณา 'และ'" },
  { id: "B2", level: "basic", expression: "~p ∨ q", title: "ลองคิดแบบ 'หรือ'", hint: "ใช้ 'หรือ' แบบรวมกรณีที่ทั้งสองข้างเป็นจริง" },
  { id: "B3", level: "basic", expression: "p ↔ ~q", title: "ค่าตรงกันหรือไม่?", hint: "ตัวเชื่อม ↔ เป็นจริงเมื่อสองข้างมีค่าเหมือนกัน" },
  { id: "M1", level: "intermediate", expression: "~(p ∧ q)", title: "นิเสธทั้งวงเล็บ", hint: "หาค่า p ∧ q ก่อน แล้วกลับค่า" },
  { id: "M2", level: "intermediate", expression: "(p ∨ q) ∧ ~p", title: "สองคอลัมน์ย่อย", hint: "หา p ∨ q และ ~p ก่อนนำมาต่อด้วย ∧" },
  { id: "M3", level: "intermediate", expression: "(p → q) ∨ ~q", title: "ใช้เงื่อนไขกับนิเสธ", hint: "หา p → q และ ~q แยกกันก่อน" },
  { id: "A1", level: "advanced", expression: "(p ∧ ~q) → r", title: "ครบสามตัวแปร", hint: "จัดเรียงค่า p, q, r ให้ครบ 8 แถว แล้วคำนวณวงเล็บ" },
  { id: "A2", level: "advanced", expression: "(p ∨ q) ↔ r", title: "หาค่าที่ตรงกัน", hint: "คำนวณ p ∨ q ก่อนเทียบกับ r" },
  { id: "A3", level: "advanced", expression: "~(p → q) ∨ r", title: "นิเสธและประพจน์ประกอบ", hint: "หาค่า p → q, กลับค่าด้วย ~ แล้วจึงใช้ ∨ r" }
]);

export function createExercise(id) {
  const item = PUBLIC_PRACTICE.find(record => record.id === id);
  if (!item) throw new Error("ไม่พบแบบฝึกที่เลือก");
  const table = makeTruthTable(item.expression);
  const targetColumns = table.columns.map((col, index) => index).filter(index => {
    if (item.level === "advanced") return true;
    if (item.level === "intermediate") return table.columns[index].kind !== "variable";
    return index === table.columns.length - 1;
  });
  return { ...item, table, targetColumns, maxScore: targetColumns.length * table.rows.length };
}

export function targetKey(rowIndex, columnIndex) {
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || !Number.isInteger(columnIndex) || columnIndex < 0) {
    throw new Error("ตำแหน่งช่องไม่ถูกต้อง");
  }
  return rowIndex + ":" + columnIndex;
}

const RULES = {
  var: "ตรวจลำดับตัวแปร: มี 2^n แถว เริ่มด้วย T และสลับเป็นกลุ่มที่เล็กลงในแต่ละคอลัมน์",
  not: "นิเสธ (~) สลับ T ↔ F ของประพจน์หลังเครื่องหมาย",
  and: "และ (∧) เป็นจริงเมื่อทั้งสองข้างจริงเท่านั้น",
  or: "หรือ (∨) เป็นจริงเมื่ออย่างน้อยหนึ่งข้างจริง รวมถึงจริงทั้งคู่",
  implies: "ถ้า...แล้ว... (→) เป็นเท็จเฉพาะกรณีหน้าเป็น T และหลังเป็น F",
  iff: "ก็ต่อเมื่อ (↔) เป็นจริงเมื่อทั้งสองข้างมีค่าตรงกัน"
};

export function diagnose(exercise, rowIndex, columnIndex) {
  const column = exercise.table.columns[columnIndex];
  const row = exercise.table.rows[rowIndex];
  if (!column || !row) throw new Error("ตำแหน่งที่ตรวจไม่ถูกต้อง");
  const type = column.kind === "variable" ? "var" : parseExpression(column.label).type;
  const assignment = exercise.table.variables.map((v, i) => v + "=" + row.values[i]).join(", ");
  return {
    row: rowIndex + 1,
    column: column.label,
    expected: row.values[columnIndex],
    context: assignment,
    explanation: RULES[type] || "คำนวณคอลัมน์ย่อยจากในวงเล็บออกมาทีละขั้น"
  };
}

export function gradeExercise(exercise, answers = {}) {
  if (!exercise || !exercise.table || !Array.isArray(exercise.targetColumns)) throw new Error("ชุดแบบฝึกไม่ถูกต้อง");
  const details = [];
  for (let rowIndex = 0; rowIndex < exercise.table.rows.length; rowIndex++) {
    for (const columnIndex of exercise.targetColumns) {
      const key = targetKey(rowIndex, columnIndex);
      const submitted = Object.prototype.hasOwnProperty.call(answers, key) ? answers[key] : null;
      const expected = exercise.table.rows[rowIndex].values[columnIndex];
      details.push({
        key, rowIndex, columnIndex,
        submitted: submitted === "T" || submitted === "F" ? submitted : null,
        expected,
        correct: submitted === expected
      });
    }
  }
  const unanswered = details.filter(item => item.submitted === null).length;
  const correct = details.filter(item => item.correct).length;
  const firstWrong = details.find(item => item.submitted !== null && !item.correct);
  return {
    complete: unanswered === 0,
    correct, total: details.length, unanswered,
    details,
    firstError: firstWrong ? diagnose(exercise, firstWrong.rowIndex, firstWrong.columnIndex) : null
  };
}

export function levelQuestions(level) {
  if (!PRACTICE_LEVELS.some(item => item.id === level)) throw new Error("ระดับแบบฝึกไม่ถูกต้อง");
  return PUBLIC_PRACTICE.filter(item => item.level === level);
}
