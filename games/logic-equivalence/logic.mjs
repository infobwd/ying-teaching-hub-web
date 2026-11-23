/** Truth-table checked exercises grounded in the supplied Thai worksheet and equivalence summary. */
export const SERIES_ID = 'ying-equivalence-2569-v1';
export const TOTAL_QUESTIONS = 15;
export const BANK = Object.freeze([
  {id:'e1', source:'แบบฝึกหัดที่ 2', left:'~(p ∨ q)', right:'~p ∨ ~q', corrected:'~p ∧ ~q', law:'กฎเดอมอร์แกน: นิเสธของ “หรือ” ต้องเปลี่ยนเป็น “และ” พร้อมนิเสธแต่ละประพจน์', fixed:true},
  {id:'e2', source:'แบบฝึกหัดที่ 2', left:'p → q', right:'~q → ~p', corrected:'~q → ~p', law:'การสลับที่และนิเสธ (บทกลับสลับนิเสธ) ให้ประพจน์สมมูลกัน', fixed:true},
  {id:'e3', source:'แบบฝึกหัดที่ 2', left:'p ∧ (q ∨ r)', right:'(p ∧ q) ∨ r', corrected:'(p ∧ q) ∨ (p ∧ r)', law:'สมบัติแจกแจง: p ต้องเชื่อมด้วย “และ” กับทั้ง q และ r', fixed:true},
  {id:'e4', source:'แบบฝึกหัดที่ 2', left:'~(p → q)', right:'p ∧ ~q', corrected:'p ∧ ~q', law:'นิเสธของ “ถ้า p แล้ว q” สมมูลกับ p เป็นจริง และ q เป็นเท็จ', fixed:true},
  {id:'e5', source:'แบบฝึกหัดที่ 2', left:'~(~p)', right:'p', corrected:'p', law:'นิเสธซ้อนสองชั้นสมมูลกับประพจน์เดิม', fixed:true},
  {id:'s2', source:'รูปแบบประพจน์สมมูล',left:'p ∧ q',right:'q ∧ p',wrong:'p ∨ q',corrected:'q ∧ p',law:'สมบัติการสลับที่ของ “และ”'},
  {id:'s3', source:'รูปแบบประพจน์สมมูล',left:'p ∨ q',right:'q ∨ p',wrong:'p ∧ q',corrected:'q ∨ p',law:'สมบัติการสลับที่ของ “หรือ”'},
  {id:'s4', source:'รูปแบบประพจน์สมมูล',left:'p ↔ q',right:'q ↔ p',wrong:'p → q',corrected:'q ↔ p',law:'สมบัติการสลับที่ของ “ก็ต่อเมื่อ”'},
  {id:'s5', source:'รูปแบบประพจน์สมมูล',left:'(p ∧ q) ∧ r',right:'p ∧ (q ∧ r)',wrong:'p ∧ (q ∨ r)',corrected:'p ∧ (q ∧ r)',law:'สมบัติการเปลี่ยนกลุ่มของ “และ”'},
  {id:'s6', source:'รูปแบบประพจน์สมมูล',left:'(p ∨ q) ∨ r',right:'p ∨ (q ∨ r)',wrong:'p ∨ (q ∧ r)',corrected:'p ∨ (q ∨ r)',law:'สมบัติการเปลี่ยนกลุ่มของ “หรือ”'},
  {id:'s7', source:'รูปแบบประพจน์สมมูล',left:'~(p ∧ q)',right:'~p ∨ ~q',wrong:'~p ∧ ~q',corrected:'~p ∨ ~q',law:'กฎเดอมอร์แกน: นิเสธ “และ” ได้ “หรือ” ของนิเสธ'},
  {id:'s9', source:'รูปแบบประพจน์สมมูล',left:'p → q',right:'~p ∨ q',wrong:'p ∨ ~q',corrected:'~p ∨ q',law:'ประพจน์เงื่อนไขสมมูลกับ “ไม่ p หรือ q”'},
  {id:'s11',source:'รูปแบบประพจน์สมมูล',left:'p ↔ q',right:'(p → q) ∧ (q → p)',wrong:'(p → q) ∨ (q → p)',corrected:'(p → q) ∧ (q → p)',law:'“ก็ต่อเมื่อ” ต้องมีเงื่อนไขทั้งสองทิศทางพร้อมกัน'},
  {id:'s13',source:'รูปแบบประพจน์สมมูล',left:'p ∨ (q ∧ r)',right:'(p ∨ q) ∧ (p ∨ r)',wrong:'(p ∨ q) ∨ (p ∨ r)',corrected:'(p ∨ q) ∧ (p ∨ r)',law:'สมบัติแจกแจงของ “หรือ” เหนือ “และ”'},
  {id:'s14',source:'รูปแบบประพจน์สมมูล',left:'p ∨ p',right:'p',wrong:'~p',corrected:'p',law:'สมบัติการซ้ำของ “หรือ”'},
  {id:'s15',source:'รูปแบบประพจน์สมมูล',left:'p ∧ p',right:'p',wrong:'~p',corrected:'p',law:'สมบัติการซ้ำของ “และ”'}
]);
function lex(text) {
  const raw=String(text).replace(/\s/g,'');
  const tokens=raw.match(/[pqr~∧∨→↔()]/gu)||[];
  if(tokens.join('')!==raw)throw Error('Unsupported logical formula: '+text);
  return tokens;
}
export function parseFormula(text){
  const tokens=lex(text);let cursor=0;
  const eat=t=>tokens[cursor]===t?(cursor++,true):false;
  const atom=()=>{
    if(eat('~'))return ['not',atom()];
    if(eat('(')){const x=iff();if(!eat(')'))throw Error('Missing close parenthesis: '+text);return x;}
    const t=tokens[cursor++];if(!['p','q','r'].includes(t))throw Error('Unexpected logical token '+t);return ['var',t];
  };
  const and=()=>{let x=atom();while(eat('∧'))x=['and',x,atom()];return x;};
  const or=()=>{let x=and();while(eat('∨'))x=['or',x,and()];return x;};
  const imp=()=>{const x=or();return eat('→')?['imp',x,imp()]:x;};
  const iff=()=>{let x=imp();while(eat('↔'))x=['iff',x,imp()];return x;};
  const result=iff();if(cursor!==tokens.length)throw Error('Remaining logical tokens in '+text);return result;
}
function evalNode(n,v){switch(n[0]){
  case 'var':return v[n[1]];
  case 'not':return !evalNode(n[1],v);
  case 'and':return evalNode(n[1],v)&&evalNode(n[2],v);
  case 'or':return evalNode(n[1],v)||evalNode(n[2],v);
  case 'imp':return !evalNode(n[1],v)||evalNode(n[2],v);
  case 'iff':return evalNode(n[1],v)===evalNode(n[2],v);
  default:throw Error('Unknown operation');
}}
export function areEquivalent(left,right){
  const a=parseFormula(left),b=parseFormula(right);
  for(let mask=0;mask<8;mask++){
    const v={p:!!(mask&1),q:!!(mask&2),r:!!(mask&4)};
    if(evalNode(a,v)!==evalNode(b,v))return false;
  }
  return true;
}
const rand=()=>{
  if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}
  return Math.random();
};
export function shuffle(arr,random=rand){const out=[...arr];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function buildRound(random=rand){
  const fixed=BANK.filter(q=>q.fixed).map(q=>({id:q.id,left:q.left,right:q.right,corrected:q.corrected,law:q.law,source:q.source,answer:areEquivalent(q.left,q.right)}));
  const selected=shuffle(BANK.filter(q=>!q.fixed),random).slice(0,10);
  const wrongIds=new Set(shuffle(selected,random).slice(0,5).map(x=>x.id));
  const extra=selected.map(q=>{const right=wrongIds.has(q.id)?q.wrong:q.right;
    return {id:q.id,left:q.left,right,corrected:q.corrected,law:q.law,source:q.source,answer:areEquivalent(q.left,right)};});
  const result=shuffle([...fixed,...extra],random);
  if(result.length!==TOTAL_QUESTIONS||result.filter(x=>x.answer).length!==8||result.filter(x=>!x.answer).length!==7)
    throw Error('Unexpected quiz balance');
  return result;
}
export function calculate(questions,answers){
  const answered=questions.filter(q=>answers[q.id]===true||answers[q.id]===false);
  const correct=answered.filter(q=>answers[q.id]===q.answer).length;
  return {correct,total:questions.length,answered:answered.length,percent:Math.round(correct/questions.length*100)};
}
export function validateStudent(input){
  const studentId=String(input.studentId||'').trim().replace(/\s/g,'');
  const room=String(input.room||'').trim();const given=String(input.given||'').trim();const family=String(input.family||'').trim();
  const errors=[];
  if(!/^\d{2,15}$/.test(studentId))errors.push('กรอกเลขประจำตัวเป็นตัวเลข 2–15 หลัก');
  if(room.length<2||room.length>30)errors.push('กรอกห้องเรียนให้ถูกต้อง เช่น ม.4/7');
  if(!given||given.length>80)errors.push('กรอกชื่อ');
  if(!family||family.length>80)errors.push('กรอกนามสกุล');
  return {student:{studentId,room,given,family},errors};
}
export function safeId(value){return String(value||'').replace(/[^a-zA-Z0-9-]/g,'').slice(0,24);}
