import {BANK,SERIES_ID,TOTAL_QUESTIONS,buildRound,calculate,validateStudent,areEquivalent} from './logic.mjs';

const $ = id => document.getElementById(id);
const KEY = 'ying-logic-quest-device-v1'; // Keep initial browser identity across content revisions
const fmt = iso => new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
  dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'
}).format(new Date(iso));
let store=null,round=null,activeRecord=null,reviewRound=null,reviewAnswers=null;
let storageUsable=true;
const views=['entry','game','result'];
const show = name => {for(const id of views)$(id).hidden=id!==name;window.scrollTo({top:0,behavior:'instant'});};
const ident = () => `${store.student.given} ${store.student.family}`;
const shortId = () => store.deviceId.slice(0,8).toUpperCase();
function uid(){return globalThis.crypto?.randomUUID?.() || (`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);}
function readStore(){try{
  localStorage.setItem('__logic_test__','yes');localStorage.removeItem('__logic_test__');
  const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):null;
}catch{storageUsable=false;return null;}}
function persist(){if(!storageUsable)return false;
  try{localStorage.setItem(KEY,JSON.stringify(store));return true;}catch{return false;}}
function showNotice(el,text){el.textContent=text;el.hidden=!text;}
function initPlayer(){
  $('register-form').hidden=!!store?.student;
  $('registered-player').hidden=!store?.student;
  if(store?.student){
    $('player-name').textContent=ident();
    $('player-meta').textContent=`เลขประจำตัว ${store.student.studentId} · ห้อง ${store.student.room} · เล่นแล้ว ${store.playCount || 0} ครั้ง`;
    $('continue-btn').textContent=store.pending?.series===SERIES_ID?'เล่นต่อจากครั้งที่ค้างไว้ →':'เริ่มภารกิจอีกครั้ง →';
    $('last-result-btn').hidden=!store.attempts?.some(a=>a.series===SERIES_ID);
  }
  if(!storageUsable){
    showNotice($('storage-error'),'เบราว์เซอร์นี้ไม่อนุญาตให้บันทึกข้อมูลบนเครื่อง จึงยังใช้ระบบจำเลขประจำตัวไม่ได้ กรุณาเปิดใน Safari/Chrome ปกติและอนุญาตพื้นที่เก็บข้อมูล');
    $('register-form').querySelector('button[type=submit]').disabled=true;
  }
}
function cleanRound(pending){
  if(!pending||pending.series!==SERIES_ID||!Array.isArray(pending.questions)||pending.questions.length!==TOTAL_QUESTIONS)return null;
  const list=[];const keys=new Set();
  const sourceRights=[...new Set(BANK.map(q=>q.right))];
  for(const item of pending.questions){
    if(keys.has(item.id))return null;keys.add(item.id);
    const origin=BANK.find(x=>x.id===item.id);
    if(!origin||item.left!==origin.left||!Array.isArray(item.options)||item.options.length!==4)return null;
    const options=item.options;
    if(new Set(options).size!==4||!options.includes(origin.right)||options.some(v=>!sourceRights.includes(v)))return null;
    if(options.filter(v=>areEquivalent(origin.left,v)).length!==1)return null;
    list.push({...origin,answer:origin.right,options:[...options]});
  }
  if(BANK.some(q=>!keys.has(q.id)))return null;
  const selected={};
  for(const q of list){const a=pending.selected?.[q.id];if(q.options.includes(a))selected[q.id]=a;}
  return {series:SERIES_ID,questions:list,selected,index:Math.min(TOTAL_QUESTIONS-1,Math.max(0,Number(pending.index)||0)),startedAt:pending.startedAt||new Date().toISOString()};
}
function startGame(){
  if(!store?.student||!storageUsable)return;
  const resumed=cleanRound(store.pending);
  round=resumed||{series:SERIES_ID,questions:buildRound(),selected:{},index:0,startedAt:new Date().toISOString()};
  if(!resumed)store.pending=round;
  if(!persist()){$('register-error').hidden=false;$('register-error').textContent='บันทึกความคืบหน้าบนเครื่องไม่สำเร็จ';return;}
  $('play-user').textContent=`${store.student.given} · ${store.student.room}`;
  show('game');renderQuestion();
}
function renderQuestion(){
  const q=round.questions[round.index];
  $('progress-count').textContent=`${round.index+1} / ${TOTAL_QUESTIONS}`;
  const answered=Object.keys(round.selected).length;
  $('progress-fill').style.width=`${answered/TOTAL_QUESTIONS*100}%`;
  $('progress-track').setAttribute('aria-valuenow',String(answered));
  $('task-type').textContent=q.source;
  $('left-formula').textContent=q.left;
  const buttons=$('options-grid').querySelectorAll('button.option-choice');
  buttons.forEach((button,i)=>{button.querySelector('.option-formula').textContent=q.options[i];button.setAttribute('aria-pressed',String(round.selected[q.id]===q.options[i]));});
  $('prev-btn').disabled=round.index===0;
  $('next-btn').disabled=!q.options.includes(round.selected[q.id]);
  $('next-btn').textContent=round.index===TOTAL_QUESTIONS-1?'ส่งคำตอบและดูคะแนน ✓':'ข้อต่อไป →';
  $('saved-hint').textContent=`ตอบแล้ว ${answered} / ${TOTAL_QUESTIONS}`;
}
function choose(answer){
  if(!round?.questions[round.index]?.options.includes(answer))return;
  round.selected[round.questions[round.index].id]=answer;
  store.pending=round;
  if(!persist())return;
  renderQuestion();
}
function navigate(delta){
  if(delta>0 && !round.questions[round.index].options.includes(round.selected[round.questions[round.index].id]))return;
  if(delta>0 && round.index===TOTAL_QUESTIONS-1){submitGame();return;}
  round.index=Math.min(TOTAL_QUESTIONS-1,Math.max(0,round.index+delta));
  store.pending=round;persist();renderQuestion();
}
function resultCode(){return uid().replace(/[^a-zA-Z0-9]/g,'').slice(0,10).toUpperCase();}
function submitGame(){
  if(Object.keys(round.selected).length!==TOTAL_QUESTIONS){alert('กรุณาตอบให้ครบทั้ง 15 ข้อ');return;}
  if(!confirm('ส่งคำตอบครบ 15 ข้อ และเปิดดูคะแนนเลยใช่หรือไม่?'))return;
  const values=calculate(round.questions,round.selected);
  const timestamp=new Date().toISOString();
  const record={series:SERIES_ID,attempt:(store.playCount||0)+1,code:resultCode(),finishedAt:timestamp,
    seconds:Math.max(0,Math.round((Date.now()-Date.parse(round.startedAt))/1000)),...values,
    details:round.questions.map(q=>({id:q.id,selected:round.selected[q.id]}))};
  store.playCount=record.attempt;
  store.attempts=[...(store.attempts||[]),record].slice(-40);
  store.pending=null;
  if(!persist()){showNotice($('share-status'),'ไม่สามารถบันทึกคะแนนลงเครื่องได้ กรุณาแคปหน้าจอผลทันที');}
  activeRecord=record;reviewRound=round.questions;reviewAnswers=round.selected;round=null;
  showResult();
}
function currentAttempts(){return (store.attempts||[]).filter(a=>a.series===SERIES_ID);}
function best(){return Math.max(0,...currentAttempts().map(a=>a.correct||0));}
function addRow(parent,className,left,right){
  const row=document.createElement('div');row.className=className;
  const a=document.createElement('span');a.textContent=left;
  const b=document.createElement('b');b.textContent=right;
  row.append(a,b);parent.append(row);
}
function buildReview(){
  const root=$('answers-review');root.replaceChildren();
  if(!reviewRound||!reviewAnswers){root.textContent='เฉลยรายละเอียดแสดงได้หลังทำแบบทดสอบในรอบปัจจุบัน';return;}
  reviewRound.forEach((q,i)=>{
    const article=document.createElement('article');article.className='review-item';
    const header=document.createElement('b');header.textContent=`ข้อ ${i+1} · ${reviewAnswers[q.id]===q.answer?'ตอบถูก':'ตอบผิด'}`;
    header.className=reviewAnswers[q.id]===q.answer?'correct':'incorrect';
    const formula=document.createElement('div');formula.className='formula-small';formula.textContent=`${q.left} ≡ ${q.right}`;
    const answer=document.createElement('p');answer.textContent=`คำตอบที่เลือก: ${reviewAnswers[q.id]||'ไม่ได้เลือก'} · ${q.law}`;
    const correction=document.createElement('p');correction.textContent=`คำตอบที่ถูกต้อง: ${q.right}`;
    article.append(header,formula,answer,correction);root.append(article);
  });
}
function showResult(){
  const a=activeRecord;if(!a)return;
  const bestScore=best();
  $('score-pct').textContent=`${a.percent}%`;
  const ring=document.querySelector('.score-ring');ring.style.background=`radial-gradient(closest-side,#fff 81%,transparent 82% 100%),conic-gradient(#7462df 0 ${a.percent}%,#ebe4fa ${a.percent}% 100%)`;
  $('result-caption').textContent=a.percent===100?'ยอดเยี่ยม! สมมูลทุกข้อ':a.percent>=80?'เยี่ยมมาก! ใกล้เต็มแล้ว':a.percent>=60?'ทำได้ดี มาทบทวนอีกนิด':'ฝึกฝนต่อได้เลย ลองทบทวนแล้วเล่นซ้ำ';
  $('result-correct').textContent=`${a.correct} / ${a.total}`;
  $('result-best').textContent=`${bestScore} / ${a.total}`;
  $('result-attempt').textContent=String(a.attempt);
  $('receipt-name').textContent=ident();
  $('receipt-id').textContent=`${store.student.studentId} · ${store.student.room}`;
  $('receipt-date').textContent=fmt(a.finishedAt);
  $('receipt-code').textContent=a.code;
  $('receipt-device').textContent=shortId();
  buildReview();
  const root=$('history-list');root.replaceChildren();
  for(const item of [...currentAttempts()].reverse().slice(0,8))addRow(root,'history-row',`ครั้งที่ ${item.attempt} · ${fmt(item.finishedAt)}`,`${item.correct} / ${item.total} (${item.percent}%)`);
  show('result');
}
function shareText(){const a=activeRecord;return `LOGIC QUEST — ผลทดสอบประพจน์สมมูล ม.4\nชื่อ: ${ident()}\nเลขประจำตัว: ${store.student.studentId}\nห้อง: ${store.student.room}\nคะแนน: ${a.correct}/${a.total} (${a.percent}%)\nครั้งที่: ${a.attempt}\nวันที่: ${fmt(a.finishedAt)}\nรหัสผล: ${a.code}\nรหัสเครื่องย่อ: ${shortId()}\n(ผลที่ส่งโดยผู้เล่นจากเครื่องนี้ ยังไม่ได้รับรองโดยระบบครู)`;}
function receiptCanvas(){
  const c=document.createElement('canvas');c.width=1080;c.height=1370;
  const x=c.getContext('2d');const w=c.width;const a=activeRecord;
  const bg=x.createLinearGradient(0,0,1080,1370);bg.addColorStop(0,'#eee8ff');bg.addColorStop(1,'#fdfaff');x.fillStyle=bg;x.fillRect(0,0,1080,1370);
  x.fillStyle='#6657cc';x.fillRect(0,0,1080,30);
  x.fillStyle='#fff';x.beginPath();x.roundRect(70,95,940,1190,36);x.fill();
  x.textAlign='center';x.fillStyle='#7365bc';x.font='bold 28px Tahoma, sans-serif';x.fillText('LOGIC QUEST  ·  MATH M.4',540,183);
  x.fillStyle='#2f2863';x.font='bold 66px Tahoma, sans-serif';x.fillText('สรุปผลประพจน์สมมูล',540,270);
  x.strokeStyle='#dad2ff';x.lineWidth=23;x.beginPath();x.arc(540,455,136,0,Math.PI*2);x.stroke();
  x.strokeStyle='#6657cc';x.beginPath();x.arc(540,455,136,-Math.PI/2,-Math.PI/2+Math.PI*2*a.percent/100);x.stroke();
  x.fillStyle='#6657cc';x.font='bold 96px Tahoma,sans-serif';x.fillText(`${a.percent}%`,540,477);
  x.fillStyle='#5c5386';x.font='28px Tahoma,sans-serif';x.fillText(`${a.correct} / ${a.total} ข้อ     •     ครั้งที่ ${a.attempt}     •     สูงสุด ${best()} / ${a.total}`,540,660);
  const rows=[['ชื่อ-นามสกุล',ident()],['เลขประจำตัว',store.student.studentId],['ห้องเรียน',store.student.room],['วันและเวลา',fmt(a.finishedAt)],['รหัสผลการเล่น',a.code],['รหัสเครื่องย่อ',shortId()]];
  x.textAlign='left';for(let i=0;i<rows.length;i++){
    const yy=775+i*70;x.fillStyle='#8179a0';x.font='25px Tahoma,sans-serif';x.fillText(rows[i][0],125,yy);
    let size=27;x.font=`bold ${size}px Tahoma,sans-serif`;
    while(x.measureText(rows[i][1]).width>515 && size>19){size--;x.font=`bold ${size}px Tahoma,sans-serif`;}
    x.textAlign='right';x.fillStyle='#29214d';x.fillText(rows[i][1],950,yy);x.textAlign='left';
    x.fillStyle='#ece7f8';x.fillRect(125,yy+22,825,1);
  }
  x.textAlign='center';x.fillStyle='#807694';x.font='21px Tahoma,sans-serif';
  x.fillText('ภาพผลที่นักเรียนส่งเอง • กรุณาให้ครูตรวจรับ',540,1243);
  return c;
}
async function downloadImage(){
  const canvas=receiptCanvas();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob){$('share-status').textContent='บันทึกภาพไม่สำเร็จ ใช้วิธีแคปหน้าจอแทน';return;}
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download=`logic-quest-${store.student.studentId}-${activeRecord.code}.png`;
  anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  $('share-status').textContent='บันทึกภาพผลคะแนนแล้ว หากใช้ iPhone สามารถเปิดภาพจากรายการดาวน์โหลดหรือแคปหน้าจอได้';
}
async function share(){
  const text=shareText();
  try{
    if(navigator.share){await navigator.share({title:'Logic Quest — ผลทดสอบประพจน์สมมูล',text});$('share-status').textContent='เปิดตัวเลือกแชร์แล้ว';}
    else if(navigator.clipboard){await navigator.clipboard.writeText(text);$('share-status').textContent='คัดลอกผลแล้ว สามารถนำไปวางใน LINE ส่งครู';}
    else $('share-status').textContent='อุปกรณ์นี้ไม่รองรับการแชร์อัตโนมัติ ให้แคปหน้าจอส่งครู';
  }catch(e){if(e.name!=='AbortError')$('share-status').textContent='แชร์ไม่สำเร็จ กรุณาใช้บันทึกภาพหรือแคปหน้าจอ';}
}
async function copyText(){
  try{await navigator.clipboard.writeText(shareText());$('share-status').textContent='คัดลอกผลแล้ว สามารถวางใน LINE ส่งครูได้';}
  catch{$('share-status').textContent='คัดลอกไม่ได้ในเบราว์เซอร์นี้ ใช้แชร์ผลหรือแคปหน้าจอแทน';}
}
$('register-form').addEventListener('submit',event=>{
  event.preventDefault();if(store?.student)return;
  const parsed=validateStudent({studentId:$('student-id').value,room:$('room').value,given:$('given').value,family:$('family').value});
  if(parsed.errors.length){showNotice($('register-error'),parsed.errors.join(' · '));return;}
  store={deviceId:uid(),student:parsed.student,createdAt:new Date().toISOString(),playCount:0,attempts:[],pending:null};
  if(!persist()){store=null;showNotice($('register-error'),'ลงทะเบียนไม่สำเร็จ: เบราว์เซอร์ไม่ให้เก็บข้อมูลลงเครื่อง');return;}
  showNotice($('register-error'),'');startGame();
});
$('continue-btn').addEventListener('click',startGame);
$('last-result-btn').addEventListener('click',()=>{
  const last=currentAttempts().at(-1);if(!last)return;
  activeRecord=last;reviewRound=null;reviewAnswers=null;showResult();
});
$('options-grid').querySelectorAll('button.option-choice').forEach((button,i)=>button.addEventListener('click',()=>{if(round)choose(round.questions[round.index].options[i]);}));
$('prev-btn').addEventListener('click',()=>navigate(-1));
$('next-btn').addEventListener('click',()=>navigate(1));
$('replay-btn').addEventListener('click',()=>{round=null;store.pending=null;persist();startGame();});
$('share-btn').addEventListener('click',share);$('image-btn').addEventListener('click',downloadImage);$('copy-btn').addEventListener('click',copyText);
window.addEventListener('storage',event=>{
  if(event.key===KEY){$('storage-error').hidden=false;$('storage-error').textContent='ข้อมูลผู้เล่นบนเครื่องนี้เปลี่ยนจากอีกแท็บ กรุณาโหลดหน้าใหม่เพื่อความถูกต้อง';
    if(!$('entry').hidden)show('entry');else{show('entry');$('register-form').querySelector('button[type=submit]').disabled=true;}
  }
});
store=readStore();
if(store && (!store.deviceId||!store.student||!Array.isArray(store.attempts)))store=null;
initPlayer();
show('entry');
