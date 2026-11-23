/** Fifteen exact equivalence laws from the latest supplied ONE-PAGE reference only. */
export const SERIES_ID = 'ying-equivalence-2569-photo-only-v2';
export const TOTAL_QUESTIONS = 15;
export const BANK = Object.freeze([
  Object.freeze({id:'s1', source:'ภาพสรุปสมมูล ข้อ 1', left:'~(~p)', right:'p', law:'สมบัตินิเสธซ้อนสองชั้น'}),
  Object.freeze({id:'s2', source:'ภาพสรุปสมมูล ข้อ 2', left:'p ∧ q', right:'q ∧ p', law:'สมบัติการสลับที่ของ “และ”'}),
  Object.freeze({id:'s3', source:'ภาพสรุปสมมูล ข้อ 3', left:'p ∨ q', right:'q ∨ p', law:'สมบัติการสลับที่ของ “หรือ”'}),
  Object.freeze({id:'s4', source:'ภาพสรุปสมมูล ข้อ 4', left:'p ↔ q', right:'q ↔ p', law:'สมบัติการสลับที่ของ “ก็ต่อเมื่อ”'}),
  Object.freeze({id:'s5', source:'ภาพสรุปสมมูล ข้อ 5', left:'(p ∧ q) ∧ r', right:'p ∧ (q ∧ r)', law:'สมบัติการเปลี่ยนกลุ่มของ “และ”'}),
  Object.freeze({id:'s6', source:'ภาพสรุปสมมูล ข้อ 6', left:'(p ∨ q) ∨ r', right:'p ∨ (q ∨ r)', law:'สมบัติการเปลี่ยนกลุ่มของ “หรือ”'}),
  Object.freeze({id:'s7', source:'ภาพสรุปสมมูล ข้อ 7', left:'~(p ∧ q)', right:'~p ∨ ~q', law:'กฎเดอมอร์แกนสำหรับ “และ”'}),
  Object.freeze({id:'s8', source:'ภาพสรุปสมมูล ข้อ 8', left:'~(p ∨ q)', right:'~p ∧ ~q', law:'กฎเดอมอร์แกนสำหรับ “หรือ”'}),
  Object.freeze({id:'s9', source:'ภาพสรุปสมมูล ข้อ 9', left:'p → q', right:'~p ∨ q', law:'รูปสมมูลของประพจน์เงื่อนไข'}),
  Object.freeze({id:'s10', source:'ภาพสรุปสมมูล ข้อ 10', left:'p → q', right:'~q → ~p', law:'รูปสลับที่และนิเสธของประพจน์เงื่อนไข'}),
  Object.freeze({id:'s11', source:'ภาพสรุปสมมูล ข้อ 11', left:'p ↔ q', right:'(p → q) ∧ (q → p)', law:'รูปสมมูลของประพจน์ก็ต่อเมื่อ'}),
  Object.freeze({id:'s12', source:'ภาพสรุปสมมูล ข้อ 12', left:'p ∧ (q ∨ r)', right:'(p ∧ q) ∨ (p ∧ r)', law:'สมบัติการแจกแจงของ “และ” เหนือ “หรือ”'}),
  Object.freeze({id:'s13', source:'ภาพสรุปสมมูล ข้อ 13', left:'p ∨ (q ∧ r)', right:'(p ∨ q) ∧ (p ∨ r)', law:'สมบัติการแจกแจงของ “หรือ” เหนือ “และ”'}),
  Object.freeze({id:'s14', source:'ภาพสรุปสมมูล ข้อ 14', left:'p ∨ p', right:'p', law:'สมบัติการซ้ำของ “หรือ”'}),
  Object.freeze({id:'s15', source:'ภาพสรุปสมมูล ข้อ 15', left:'p ∧ p', right:'p', law:'สมบัติการซ้ำของ “และ”'}),
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
/** The student's answer must match one expression from the reference page.
    All 15 original (left,right) pairs are kept intact; only the choices/order are shuffled.
    Distractors are also RHS expressions from that same page and truth-table-proven non-equivalent. */
export function buildRound(random=rand){
  const allRights=[...new Set(BANK.map(q=>q.right))];
  const questions=BANK.map(q=>{
    if(!areEquivalent(q.left,q.right))throw Error('Reference source formula is not equivalent: '+q.id);
    const candidates=allRights.filter(r=>r!==q.right && !areEquivalent(q.left,r));
    if(candidates.length<3)throw Error('Insufficient source-only distractors for '+q.id);
    const options=shuffle([q.right,...shuffle(candidates,random).slice(0,3)],random);
    return {...q,answer:q.right,options};
  });
  return shuffle(questions,random);
}
export function calculate(questions,answers){
  const answered=questions.filter(q=>q.options.includes(answers[q.id]));
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
