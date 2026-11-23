import test from 'node:test';
import assert from 'node:assert/strict';
import {BANK,TOTAL_QUESTIONS,areEquivalent,buildRound,calculate,validateStudent,parseFormula} from '../games/logic-equivalence/logic.mjs';

test('all correct identities verified from exhaustive 8-row truth tables',()=>{
  for(const q of BANK)assert.equal(areEquivalent(q.left,q.corrected),true,q.id);
});
test('false original examples are actually not equivalent',()=>{
  for(const q of BANK.filter(x=>x.fixed))assert.equal(areEquivalent(q.left,q.right),!['e1','e3'].includes(q.id),q.id);
});
test('each generated distractor is objectively false',()=>{
  for(const q of BANK.filter(x=>!x.fixed))assert.equal(areEquivalent(q.left,q.wrong),false,q.id);
});
test('balanced rounds, all original 5 included, unique tasks',()=>{
  for(let k=0;k<40;k++){
    const round=buildRound();assert.equal(round.length,TOTAL_QUESTIONS);
    assert.equal(new Set(round.map(x=>x.id)).size,TOTAL_QUESTIONS);
    assert.equal(round.filter(x=>x.answer).length,8);
    for(const id of ['e1','e2','e3','e4','e5'])assert.ok(round.some(x=>x.id===id));
  }
});
test('scoring is exact; blanks are not correct',()=>{
  const round=buildRound(),answers=Object.fromEntries(round.map(q=>[q.id,q.answer]));
  assert.deepEqual(calculate(round,answers),{correct:15,total:15,answered:15,percent:100});
  delete answers[round[0].id];
  assert.equal(calculate(round,answers).correct,14);
  assert.equal(calculate(round,answers).answered,14);
});
test('student identifiers validated, and no personal names are hardcoded',()=>{
  assert.deepEqual(validateStudent({studentId:'12345',room:'ม.4/7',given:'ทดสอบ',family:'ระบบ'}).errors,[]);
  assert.ok(validateStudent({studentId:'A1',room:'',given:'',family:''}).errors.length>=4);
});
test('unrecognized tokens are blocked',()=>assert.throws(()=>parseFormula('p === q')));
