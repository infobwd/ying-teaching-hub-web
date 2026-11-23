import test from 'node:test';
import assert from 'node:assert/strict';
import {BANK,SERIES_ID,TOTAL_QUESTIONS,areEquivalent,buildRound,calculate,validateStudent,parseFormula} from '../games/logic-equivalence/logic.mjs';

test('only 15 statements from the single provided summary page',()=>{
  assert.equal(BANK.length,15);
  assert.deepEqual(BANK.map(q=>q.id),Array.from({length:15},(_,i)=>'s'+(i+1)));
  assert.ok(SERIES_ID.endsWith('photo-only-v2'));
  assert.ok(BANK.every(q=>q.source.startsWith('ภาพสรุปสมมูล ข้อ ')));
});
test('every original pair exactly retains a valid equivalence',()=>{
  for(const q of BANK)assert.equal(areEquivalent(q.left,q.right),true,q.id);
});
test('every answer option comes from the single page and has exactly one true result',()=>{
  const rights=new Set(BANK.map(q=>q.right));
  for(let k=0;k<80;k++){
    const round=buildRound();assert.equal(round.length,TOTAL_QUESTIONS);
    assert.equal(new Set(round.map(q=>q.id)).size,TOTAL_QUESTIONS);
    for(const q of round){
      assert.equal(q.options.length,4,q.id);
      assert.equal(new Set(q.options).size,4,q.id);
      assert.ok(q.options.every(v=>rights.has(v)),q.id);
      assert.equal(q.options.filter(v=>areEquivalent(q.left,v)).length,1,q.id);
      assert.equal(q.answer,q.right,q.id);
    }
  }
});
test('scoring rewards only equivalent selections, unanswered is not correct',()=>{
  const r=buildRound(),answers=Object.fromEntries(r.map(q=>[q.id,q.answer]));
  assert.deepEqual(calculate(r,answers),{correct:15,total:15,answered:15,percent:100});
  const wrong=r[0].options.find(v=>v!==r[0].answer);answers[r[0].id]=wrong;
  assert.equal(calculate(r,answers).correct,14);
  delete answers[r[1].id];assert.equal(calculate(r,answers).answered,14);
  assert.equal(calculate(r,answers).correct,13);
});
test('old exercise-2 statements never reappear',()=>{
  assert.ok(!BANK.some(q=>q.id.startsWith('e')));
  assert.ok(!BANK.some(q=>q.left==='~(p → q)'));
});
test('student validation remains compatible with existing browser identity',()=>{
  assert.deepEqual(validateStudent({studentId:'12345',room:'ม.4/7',given:'ทดสอบ',family:'ระบบ'}).errors,[]);
  assert.ok(validateStudent({studentId:'A1',room:'',given:'',family:''}).errors.length>=4);
});
test('unrecognized logical tokens blocked',()=>assert.throws(()=>parseFormula('p === q')));
