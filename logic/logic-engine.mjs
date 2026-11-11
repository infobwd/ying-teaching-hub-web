/* Truth Table Lab — pure, dependency-free propositional logic engine.
   No user identifiers, network calls, dynamic evaluation or private answer bank. */
const BINARY = {
  "∧": { type: "and", precedence: 4, symbol: "∧" },
  "∨": { type: "or", precedence: 3, symbol: "∨" },
  "→": { type: "implies", precedence: 2, symbol: "→", rightAssociative: true },
  "↔": { type: "iff", precedence: 1, symbol: "↔" }
};
const SYMBOLS = { and: "∧", or: "∨", implies: "→", iff: "↔" };
const MAX_LENGTH = 120;
const MAX_TOKENS = 80;
const MAX_DEPTH = 18;

export function tokenize(source) {
  if (typeof source !== "string" || !source.trim()) throw new Error("กรุณาใส่ประพจน์ก่อนสร้างตาราง");
  if (source.length > MAX_LENGTH) throw new Error("ประพจน์ยาวเกินไป กรุณาใช้ไม่เกิน 120 ตัวอักษร");
  const tokens = [];
  for (let i = 0; i < source.length;) {
    if (/\s/u.test(source[i])) { i += 1; continue; }
    if (source.startsWith("<->", i)) { tokens.push("↔"); i += 3; }
    else if (source.startsWith("->", i)) { tokens.push("→"); i += 2; }
    else {
      const ch = source[i++];
      if (ch === "¬" || ch === "!") tokens.push("~");
      else if ("pqr()~∧∨→↔".includes(ch)) tokens.push(ch);
      else throw new Error("พบอักขระที่ไม่รองรับ: " + ch + " (ใช้ p, q, r และตัวเชื่อมที่แสดงไว้)");
    }
    if (tokens.length > MAX_TOKENS) throw new Error("ประพจน์ซับซ้อนเกินไป กรุณาลดจำนวนสัญลักษณ์");
  }
  return tokens;
}

export function parseExpression(source) {
  const tokens = tokenize(source);
  let index = 0;
  const peek = () => tokens[index];
  const consume = () => tokens[index++];
  function atom(depth) {
    if (depth > MAX_DEPTH) throw new Error("วงเล็บซ้อนลึกเกินไป");
    const t = consume();
    if (t === "p" || t === "q" || t === "r") return { type: "var", name: t };
    if (t === "~") return { type: "not", child: expression(5, depth + 1) };
    if (t === "(") {
      const node = expression(0, depth + 1);
      if (consume() !== ")") throw new Error("วงเล็บเปิดและปิดไม่ครบ");
      return node;
    }
    throw new Error("ตำแหน่งนี้ต้องเป็น p, q, r, ~ หรือวงเล็บเปิด");
  }
  function expression(min, depth) {
    if (depth > MAX_DEPTH) throw new Error("ประพจน์ซับซ้อนเกินไป");
    let left = atom(depth);
    while (BINARY[peek()] && BINARY[peek()].precedence >= min) {
      const operator = BINARY[consume()];
      const right = expression(operator.precedence + (operator.rightAssociative ? 0 : 1), depth + 1);
      left = { type: operator.type, left, right };
    }
    return left;
  }
  const ast = expression(0, 0);
  if (index !== tokens.length) throw new Error("ตรวจวงเล็บหรือตัวเชื่อมอีกครั้ง: มีสัญลักษณ์ส่วนเกิน");
  return ast;
}

export function evaluate(node, values) {
  switch (node.type) {
    case "var":
      if (!Object.hasOwn(values, node.name) || typeof values[node.name] !== "boolean") {
        throw new Error("ยังไม่ได้กำหนดค่าตัวแปร " + node.name);
      }
      return values[node.name];
    case "not": return !evaluate(node.child, values);
    case "and": return evaluate(node.left, values) && evaluate(node.right, values);
    case "or": return evaluate(node.left, values) || evaluate(node.right, values);
    case "implies": return !evaluate(node.left, values) || evaluate(node.right, values);
    case "iff": return evaluate(node.left, values) === evaluate(node.right, values);
    default: throw new Error("ชนิดตัวเชื่อมไม่ถูกต้อง");
  }
}

export function formatNode(node, outer = true) {
  if (node.type === "var") return node.name;
  if (node.type === "not") {
    const child = formatNode(node.child, false);
    return "~" + (node.child.type === "var" || node.child.type === "not" ? child : "(" + child + ")");
  }
  const content = formatNode(node.left, false) + " " + SYMBOLS[node.type] + " " + formatNode(node.right, false);
  return outer ? content : "(" + content + ")";
}

function collectVariables(node, found = new Set()) {
  if (node.type === "var") found.add(node.name);
  else if (node.type === "not") collectVariables(node.child, found);
  else { collectVariables(node.left, found); collectVariables(node.right, found); }
  return found;
}

function collectStages(node, stages, seen) {
  if (node.type === "var") return;
  if (node.type === "not") collectStages(node.child, stages, seen);
  else {
    collectStages(node.left, stages, seen);
    collectStages(node.right, stages, seen);
  }
  const label = formatNode(node);
  if (!seen.has(label)) {
    stages.push({ label, node });
    seen.add(label);
  }
}

export function makeTruthTable(source) {
  const ast = parseExpression(source);
  const variables = [...collectVariables(ast)].sort();
  if (variables.length > 3) throw new Error("ขณะนี้รองรับสูงสุด 3 ตัวแปร");
  const stages = [];
  collectStages(ast, stages, new Set());
  const columns = [
    ...variables.map(name => ({ label: name, kind: "variable" })),
    ...stages.map((stage, index) => ({ label: stage.label, kind: index === stages.length - 1 ? "final" : "intermediate" }))
  ];
  const rows = [];
  const results = [];
  for (let i = 0; i < 2 ** variables.length; i += 1) {
    const values = Object.fromEntries(variables.map((name, index) => [
      name, (i & (1 << (variables.length - index - 1))) === 0
    ]));
    const final = evaluate(ast, values);
    results.push(final);
    rows.push({
      values: [
        ...variables.map(name => values[name] ? "T" : "F"),
        ...stages.map(stage => evaluate(stage.node, values) ? "T" : "F")
      ]
    });
  }
  const classification = results.every(Boolean) ? "tautology" :
    results.every(v => !v) ? "contradiction" : "contingency";
  return { expression: formatNode(ast), variables, columns, rows, classification,
    trueRows: results.filter(Boolean).length, falseRows: results.filter(v => !v).length };
}

export function operatorResult(operator, p, q) {
  const types = { "~": "not", "∧": "and", "∨": "or", "→": "implies", "↔": "iff" };
  const type = types[operator];
  if (!type || typeof p !== "boolean" || typeof q !== "boolean") throw new Error("เลือกตัวเชื่อมหรือค่าความจริงไม่ถูกต้อง");
  return evaluate(type === "not" ? { type, child: { type: "var", name: "p" } } :
    { type, left: { type: "var", name: "p" }, right: { type: "var", name: "q" } }, { p, q });
}
