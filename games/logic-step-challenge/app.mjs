import {areEquivalent,shuffle,validateStudent} from '../logic-equivalence/logic.mjs';
const missions=[
{left:'p → (q ∨ r)',right:'(p ∧ ~r) → q',steps:[
['~p ∨ (q ∨ r)','รูปสมมูลของประพจน์เงื่อนไข'],
['~p ∨ r ∨ q','สมบัติการสลับที่และการเปลี่ยนกลุ่ม'],
['(~p ∨ r) ∨ q','สมบัติการเปลี่ยนกลุ่ม'],
['~(p ∧ ~r) ∨ q','กฎเดอมอร์แกนและนิเสธซ้อน']],same:true,note:'บรรทัดสุดท้ายแปลงกลับเป็น (p ∧ ~r) → q ได้'},
{left:'(p ∧ q) → r',right:'(p → r) ∨ (q → r)',steps:[
['~(p ∧ q) ∨ r','รูปสมมูลของประพจน์เงื่อนไข'],
['~p ∨ ~q ∨ r','กฎเดอมอร์แกนและการเปลี่ยนกลุ่ม'],
['~p ∨ ~q ∨ r ∨ r','สมบัติการซ้ำของ “หรือ”'],
['(~p ∨ r) ∨ (~q ∨ r)','สมบัติการสลับที่และการเปลี่ยนกลุ่ม'],
['(p → r) ∨ (q → r)','รูปสมมูลของประพจน์เงื่อนไข']],same:true,note:'ได้ประพจน์ตรงกับด้านขวา'},
{left:'p → (q → r)',right:'(p → q) → r',steps:[
['~p ∨ (q → r)','รูปสมมูลของประพจน์เงื่อนไข'],
['~p ∨ (~q ∨ r)','รูปสมมูลของประพจน์เงื่อนไข'],
['(~p ∨ ~q) ∨ r','สมบัติการเปลี่ยนกลุ่ม'],
['~(p ∧ q) ∨ r','กฎเดอมอร์แกน'],
['(p ∧ q) → r','รูปสมมูลของประพจน์เงื่อนไข']],same:false,note:'ตัวอย่างโต้แย้ง: p=F, q=T, r=F ทำให้ p → (q → r) เป็น T แต่ (p → q) → r เป็น F จึงไม่สมมูลกัน'},
{left:'p ↔ q',right:'(~p ∨ q) ∧ (~p → q)',steps:[
['(p → q) ∧ (q → p)','รูปสมมูลของประพจน์ก็ต่อเมื่อ'],
['(~p ∨ q) ∧ (~p → ~q)','รูปสมมูลของประพจน์เงื่อนไข และรูปสลับที่และนิเสธ']],same:false,note:'ตัวอย่างโต้แย้ง: p=F, q=F ทำให้ p ↔ q เป็น T แต่ (~p ∨ q) ∧ (~p → q) เป็น F จึงไม่สมมูลกัน'}
];
// Three curated distractors per source-blue line; never borrow another correct line.
const DISTRACTOR_VERSION=3;
const SCORE_VERSION=3;
const distractors=[
  [
    [
      "p ∨ (q ∨ r)",
      "~p ∧ (q ∨ r)",
      "~p ∨ (q ∧ r)"
    ],
    [
      "~p ∨ ~r ∨ q",
      "p ∨ r ∨ q",
      "(~p ∧ r) ∨ q"
    ],
    [
      "(~p ∨ r) ∧ q",
      "(p ∧ r) ∨ q",
      "(~p ∧ ~r) ∨ q"
    ],
    [
      "~(p ∨ ~r) ∨ q",
      "~(p ∧ r) ∨ q",
      "~(p ∧ ~r) ∧ q"
    ]
  ],
  [
    [
      "~(p ∨ q) ∨ r",
      "(p ∧ q) ∨ r",
      "~(p ∧ q) ∧ r"
    ],
    [
      "(~p ∧ ~q) ∨ r",
      "p ∨ ~q ∨ r",
      "~p ∨ q ∨ r"
    ],
    [
      "~p ∨ ~q ∨ ~r ∨ r",
      "~p ∧ ~q ∨ r ∨ r",
      "~p ∨ ~q ∨ ~r ∨ ~r"
    ],
    [
      "(~p ∨ r) ∧ (~q ∨ r)",
      "(p ∨ r) ∨ (~q ∨ r)",
      "(~p ∨ r) ∨ (q ∨ r)"
    ],
    [
      "(p → r) ∧ (q → r)",
      "(r → p) ∨ (q → r)",
      "(p → ~r) ∨ (q → ~r)"
    ]
  ],
  [
    [
      "p ∨ (q → r)",
      "~p ∧ (q → r)",
      "~p ∨ (r → q)"
    ],
    [
      "~p ∨ (q ∨ r)",
      "~p ∨ (~q ∧ r)",
      "~p ∧ (~q ∨ r)"
    ],
    [
      "(~p ∧ ~q) ∨ r",
      "(p ∨ ~q) ∨ r",
      "(~p ∨ ~q) ∧ r"
    ],
    [
      "~(p ∨ q) ∨ r",
      "(p ∧ q) ∨ r",
      "~(p ∧ q) ∧ r"
    ],
    [
      "(p ∨ q) → r",
      "(p ∧ q) → ~r",
      "(p → q) → r"
    ]
  ],
  [
    ["(p → q) ∨ (q → p)", "(p → q) ∧ (p → ~q)", "(p → q) ∧ (~q → p)"],
    ["(~p ∨ q) ∨ (~p → ~q)", "(~p ∧ q) ∧ (~p → ~q)", "(p ∨ q) ∧ (~p → ~q)"]
  ]
];
const norm=s=>s.replace(/\s/g,'');
for(const [mi,m] of missions.entries()){
  if(areEquivalent(m.left,m.right)!==m.same||m.steps.some(([s])=>!areEquivalent(m.left,s)))throw Error('Invalid mission');
  const blue=new Set(m.steps.map(([s])=>norm(s))),seen=new Set();
  if(distractors[mi].length!==m.steps.length)throw Error('Invalid distractor count');
  for(const [si,[answer]] of m.steps.entries()){
    const wrong=distractors[mi][si];
    if(wrong.length!==3)throw Error('Invalid line distractors');
    for(const d of wrong){
      if(blue.has(norm(d))||seen.has(norm(d))||areEquivalent(answer,d))throw Error('Invalid distractor: '+d);
      seen.add(norm(d));
    }
    if(wrong.some((d,i)=>wrong.slice(i+1).some(e=>areEquivalent(d,e))))throw Error('Equivalent distractors in line');
  }
}
const tasks=missions.flatMap((m,mi)=>[...m.steps.map(([answer,law],si)=>({mi,si,answer,law,options:shuffle([answer,...distractors[mi][si]])})),{mi,si:m.steps.length,answer:m.same?'สมมูลกัน':'ไม่สมมูลกัน',law:m.note,options:shuffle(['สมมูลกัน','ไม่สมมูลกัน'])}]);
const TOTAL=tasks.length;
const maxFor=a=>a.parts.reduce((sum,p)=>sum+p.max,0);
const $=id=>document.getElementById(id),KEY='ying-logic-step-challenge-v1',OLD='ying-logic-quest-device-v1';
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const fmt=t=>new Intl.DateTimeFormat('th-TH-u-ca-buddhist',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(t));
let store,active,selected=null,usable=true,stale=false;
const show=id=>{for(const v of ['entry','game','result'])$(v).hidden=v!==id;window.scrollTo(0,0)};
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));return true}catch{$('notice').textContent='บันทึกข้อมูลไม่สำเร็จ โปรดแคปผลไว้';return false}}
function name(){return store.student.given+' '+store.student.family}
function el(tag,txt,cls){const n=document.createElement(tag);n.textContent=txt;if(cls)n.className=cls;return n}
try{localStorage.setItem(KEY+'-test','1');localStorage.removeItem(KEY+'-test');store=JSON.parse(localStorage.getItem(KEY)||'null');if(!store){const old=JSON.parse(localStorage.getItem(OLD)||'null');if(old?.student&&!validateStudent(old.student).errors.length){store={student:validateStudent(old.student).student,device:old.deviceId||uid(),count:0,first:null,best:0,history:[],pending:null};save()}}}catch{usable=false}
if(!store?.student||validateStudent(store.student).errors.length||!Array.isArray(store.history))store=null;
function entry(){const policy=document.querySelector('.privacy p');if(policy)policy.textContent='เกณฑ์คะแนน: คำตอบที่ถูกต้องต่อเนื่องจากบรรทัดแรกได้บรรทัดละ 1 คะแนน เมื่อผิดแล้วจะไม่ได้คะแนนส่วนถัดไป รวมถึงคำตอบสรุป จบแต่ละข้อจะแสดงคะแนนก่อนเริ่มข้อใหม่';show('entry');$('register').hidden=!!store;$('registered').hidden=!store;if(store){$('who').textContent=name()+' · '+store.student.room+' · '+store.student.studentId;$('start').textContent=store.pending?'เล่นต่อจากที่ค้างไว้ →':'เริ่มภารกิจ →';$('last').hidden=!store.history.length}if(!usable||stale){$('notice').textContent='ไม่สามารถใช้ข้อมูลบนเครื่องได้ กรุณาเปิดเบราว์เซอร์ปกติหรือโหลดหน้าใหม่';$('start').disabled=true;$('register').querySelector('button').disabled=true}}
function start(){if(!store||!usable||stale)return;if(store.scoreVersion!==SCORE_VERSION){store.scoreVersion=SCORE_VERSION;store.first=null;store.best=0;}if(!store.pending)store.pending={index:0,answers:[],options:tasks.map(t=>shuffle(t.options)),distractorVersion:DISTRACTOR_VERSION};else if(store.pending.distractorVersion!==DISTRACTOR_VERSION){for(let i=store.pending.index;i<tasks.length;i++)store.pending.options[i]=shuffle(tasks[i].options);store.pending.distractorVersion=DISTRACTOR_VERSION;}if(!save())return;selected=null;show('game');render()}
function renderCheckpoint(){const p=store.pending,mi=p.checkpoint,m=missions[mi],part=score(p.answers)[mi],cum=score(p.answers).slice(0,mi+1).reduce((sum,x)=>sum+x.total,0),max=missions.slice(0,mi+1).reduce((sum,x)=>sum+x.steps.length+1,0);$('progress').textContent='จบภารกิจ '+(mi+1)+' / '+missions.length;$('bar').value=p.answers.length;$('pair').textContent='คะแนนข้อ '+(mi+1)+' : '+part.total+' / '+part.max;$('board').replaceChildren(el('p','คะแนนวิธีทำ '+part.method+' / '+m.steps.length),el('p','คะแนนสรุป '+part.conclusion+' / 1'),el('p','คะแนนสะสม '+cum+' / '+max),el('p','คะแนนนับต่อเนื่องจากบรรทัดแรก หยุดเมื่อพบคำตอบผิด รวมถึงคำตอบสรุป'));$('prompt').textContent='สรุปคะแนนก่อนทำข้อต่อไป';$('options').replaceChildren();$('next').disabled=false;$('next').textContent=p.index===tasks.length?'ดูผลคะแนนรวม':'เริ่มข้อ '+(mi+2)+' →';window.scrollTo(0,0)}
function render(){if(Number.isInteger(store.pending.checkpoint)){renderCheckpoint();return;}const p=store.pending,t=tasks[p.index],m=missions[t.mi];$('progress').textContent='ภารกิจ '+(t.mi+1)+'/'+missions.length+' · ตอบแล้ว '+p.answers.length+'/'+TOTAL;$('bar').value=p.answers.length;$('pair').textContent=m.left+'   กับ   '+m.right;$('prompt').textContent=t.si===m.steps.length?'สรุป: ประพจน์ทั้งสองสมมูลกันหรือไม่?':'เลือกประพจน์ในบรรทัดที่ '+(t.si+1);const board=$('board');board.replaceChildren(el('p',m.left,'formula-small'));for(let i=0;i<m.steps.length;i++){const idx=tasks.findIndex(x=>x.mi===t.mi&&x.si===i);board.append(el('p','≡  '+(p.answers[idx]??'________________'),'formula-small'))}const options=$('options');options.replaceChildren();p.options[p.index].forEach((v,i)=>{const b=el('button',['ก','ข','ค','ง'][i]+'.  '+v,'answer option-choice');b.type='button';b.setAttribute('aria-pressed',String(selected===v));b.onclick=()=>{selected=v;render()};options.append(b)});$('next').disabled=selected===null;$('next').textContent=t.si===m.steps.length?'ยืนยันและดูคะแนนข้อนี้':'ยืนยันคำตอบ →'}
function score(answers){return missions.map((m,mi)=>{let method=0,chain=true;const rows=tasks.map((t,i)=>({t,i})).filter(x=>x.t.mi===mi);for(const {t,i} of rows.slice(0,-1)){chain=chain&&answers[i]===t.answer;if(chain)method++}const last=rows.at(-1);const conclusion=Number(chain&&answers[last.i]===last.t.answer);return {method,conclusion,total:method+conclusion,max:m.steps.length+1}})}
function finish(){const answers=store.pending.answers.slice(),parts=score(answers),total=parts.reduce((a,b)=>a+b.total,0);active={answers,parts,total,scoreVersion:SCORE_VERSION,at:new Date().toISOString(),attempt:++store.count,code:uid().slice(0,10)};store.first??=total;store.best=Math.max(store.best,total);store.history.push(active);store.history=store.history.slice(-40);store.pending=null;save();result()}
function result(){show('result');$('points').textContent=active.total+' / '+maxFor(active);const maxLabel=document.querySelector('.score-ring span');if(maxLabel)maxLabel.textContent='คะแนนเต็ม '+maxFor(active);$('meta').textContent=name()+' · '+store.student.room+' · '+store.student.studentId;$('stats').textContent=active.scoreVersion===SCORE_VERSION?'ครั้งที่ '+active.attempt+' · ครั้งแรกชุด 20 คะแนน '+store.first+'/'+TOTAL+' · สูงสุด '+store.best+'/'+TOTAL:'ครั้งที่ '+active.attempt+' · คะแนนจากชุดเดิม';$('stamp').textContent=fmt(active.at)+' · รหัสผล '+active.code;$('parts').replaceChildren(...active.parts.map((p,i)=>el('p','ภารกิจ '+(i+1)+' : '+p.total+'/'+p.max+' (วิธีทำ '+p.method+' · สรุป '+p.conclusion+')')));const review=$('review');review.replaceChildren();if(active.scoreVersion===SCORE_VERSION)review.append(el('p','คะแนนนับต่อเนื่องเท่านั้น คำตอบที่ถูกหลังจากบรรทัดแรกที่ผิดจะไม่เพิ่มคะแนน'));missions.slice(0,active.parts.length).forEach((m,mi)=>{review.append(el('h3','ภารกิจ '+(mi+1)));review.append(el('p',m.left+' กับ '+m.right));tasks.forEach((t,i)=>{if(t.mi!==mi)return;review.append(el('p',(t.si===m.steps.length?'สรุป':'บรรทัด '+(t.si+1))+' · '+(active.answers[i]===t.answer?'ถูก':'ผิด')+' | เลือก: '+active.answers[i]+' | เฉลย: '+t.answer+' — '+t.law))});review.append(el('p',m.note))});$('history').replaceChildren(...store.history.slice().reverse().map(a=>el('p','ครั้งที่ '+a.attempt+' · '+a.total+'/'+maxFor(a)+' · '+(a.scoreVersion===SCORE_VERSION?'ชุดปัจจุบัน':'ชุดเดิม')+' · '+fmt(a.at))))}
function shareText(){return ['Logic Step Challenge — ม.4',name()+' · '+store.student.room+' · '+store.student.studentId,'คะแนน '+active.total+'/'+maxFor(active)+' · ครั้งที่ '+active.attempt,active.scoreVersion===SCORE_VERSION?'ครั้งแรกชุด 20 คะแนน '+store.first+'/'+TOTAL+' · สูงสุด '+store.best+'/'+TOTAL:'คะแนนจากชุดเดิม',...active.parts.map((p,i)=>'ภารกิจ '+(i+1)+' '+p.total+'/'+p.max),fmt(active.at),'รหัสผล '+active.code,'ผลจากเครื่องผู้เล่น ยังไม่ได้รับรองโดยระบบครู'].join('\n')}
async function share(){try{if(navigator.share)await navigator.share({title:'Logic Step Challenge',text:shareText()});else if(navigator.clipboard){await navigator.clipboard.writeText(shareText());$('status').textContent='คัดลอกผลแล้ว'}else $('status').textContent='ใช้แคปหน้าจอส่งครู'}catch(e){if(e.name!=='AbortError')$('status').textContent='แชร์ไม่สำเร็จ กรุณาแคปหน้าจอ'}}
async function image(){try{const c=document.createElement('canvas');c.width=1080;c.height=1200;const x=c.getContext('2d');x.fillStyle='#f3edff';x.fillRect(0,0,1080,1200);x.fillStyle='#fff';x.fillRect(45,45,990,1110);x.textAlign='center';x.fillStyle='#6657cc';x.font='bold 40px Tahoma,sans-serif';x.fillText('LOGIC STEP CHALLENGE',540,120);x.font='bold 100px Tahoma,sans-serif';x.fillText(active.total+' / '+maxFor(active),540,270);x.fillStyle='#29214d';x.font='32px Tahoma,sans-serif';shareText().split('\n').slice(1).forEach((s,i)=>x.fillText(s,540,355+i*70,940));const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob)throw Error();const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='logic-step-'+active.code+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}catch{$('status').textContent='บันทึกภาพไม่ได้ กรุณาแคปหน้าจอ'}}
$('register').onsubmit=e=>{e.preventDefault();if(store||!usable||stale)return;const input=Object.fromEntries(new FormData(e.currentTarget)),v=validateStudent(input);if(v.errors.length){$('notice').textContent=v.errors.join(' · ');return}store={student:v.student,device:uid(),count:0,first:null,best:0,history:[],pending:null};if(save())start();else store=null};
$('start').onclick=start;$('last').onclick=()=>{active=store.history.at(-1);if(active)result()};$('next').onclick=()=>{if(stale||!store?.pending)return;const p=store.pending;if(Number.isInteger(p.checkpoint)){if(p.index===tasks.length){finish();return}delete p.checkpoint;selected=null;save();render();return}if(selected===null||!p.options[p.index].includes(selected))return;const t=tasks[p.index];p.answers.push(selected);p.index++;selected=null;if(t.si===missions[t.mi].steps.length)p.checkpoint=t.mi;save();render()};$('again').onclick=start;$('share').onclick=share;$('image').onclick=image;window.addEventListener('storage',e=>{if(e.key===KEY){stale=true;entry()}});entry();
