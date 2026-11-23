"use strict";

/**
 * Ying Classroom World — original zero-dependency isometric 3D scene.
 * Geometry uses XYZ cuboids/planes, a rotating camera and depth-sorted faces.
 * This is a preview only: no identity, personal data, score, or live presence.
 */
const canvas = document.getElementById("roomCanvas");
const viewport = document.getElementById("viewport");
const ctx = canvas.getContext("2d", { alpha: false });
const dom = {
  boardTag: document.getElementById("boardTag"),
  subtitle: document.getElementById("room-subtitle"),
  lesson: document.getElementById("lessonLink"),
  game: document.getElementById("gameLink"),
  gameDesc: document.getElementById("gameDescription"),
  avatar: document.getElementById("avatarTag"),
  changeAvatar: document.getElementById("changeAvatar"),
  notice: document.getElementById("notice"),
  noticeTitle: document.getElementById("noticeTitle"),
  noticeMessage: document.getElementById("noticeMessage")
};
const content = {
  m4: {
    subtitle: "ม.4 · ตรรกศาสตร์เพิ่มเติม",
    board: "Logic Lab · ม.4",
    lesson: "../../math.html#m4-h1",
    game: "../../games/logic-equivalence/",
    gameDescription: "เกมตรรกศาสตร์ ม.4"
  },
  m2: {
    subtitle: "ม.2 · เลขยกกำลังและการประยุกต์",
    board: "Power Numbers · ม.2",
    lesson: "../../math.html#m2-h1",
    game: null,
    gameDescription: "เกม ม.2 กำลังเตรียม"
  }
};
const state = {
  level: "m4",
  yaw: 0.71,
  pitch: 0.68,
  outfit: 0,
  width: 800,
  height: 500,
  scale: 46,
  pointer: null
};
const outfits = [
  { shirt: ["#fae1e7","#ebc3d0","#d8acba"], pants: ["#a9b2c4","#818ea8","#95a1b9"], accent:"#d688a0" },
  { shirt: ["#d8eee0","#a9d6bd","#8dbfa5"], pants: ["#9ba9b0","#748a96","#8a9ba4"], accent:"#73a38c" },
  { shirt: ["#dfd9fb","#c1b9ed","#b1a8dd"], pants: ["#a7a9be","#8388a6","#9398b2"], accent:"#9c8ccd" }
];
const faces = [];
const markings = [];
const hotspots = [
  { id: "hotspotLesson", xyz: [-2.75, 1.5, 1.50] },
  { id: "hotspotGame", xyz: [4.30, 1.78, -0.35] },
  { id: "hotspotScore", xyz: [4.15, 1.50, 3.1] },
  { id: "hotspotTeacher", xyz: [2.86, 2.48, -3.10] }
];
function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
function vector(x,y,z) { return [x,y,z]; }
function depth(point) { return point[0] * Math.sin(state.yaw) + point[2] * Math.cos(state.yaw); }
function project(p) {
  const s = Math.sin(state.yaw), c = Math.cos(state.yaw);
  const sl = Math.sin(state.pitch), cl = Math.cos(state.pitch);
  const across = p[0]*c - p[2]*s;
  const forward = p[0]*s + p[2]*c;
  return {
    x: state.width * .50 + across * state.scale,
    y: state.height * .605 - (p[1]*cl - forward*sl) * state.scale
  };
}
function surface(points, fill, edge = null) {
  faces.push({ points, fill, edge, depth: points.reduce((sum,p)=>sum+depth(p),0)/points.length });
}
function box(x,y,z,w,h,d,colors) {
  const x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
  const a=vector(x0,y0,z0),b=vector(x1,y0,z0),c=vector(x1,y0,z1),d0=vector(x0,y0,z1);
  const e=vector(x0,y1,z0),f=vector(x1,y1,z0),g=vector(x1,y1,z1),h0=vector(x0,y1,z1);
  surface([e,f,g,h0], colors[0]);
  surface([d0,c,g,h0], colors[1] || colors[0]);
  surface([b,c,g,f], colors[2] || colors[0]);
  surface([a,d0,h0,e], colors[3] || colors[2] || colors[0]);
  surface([a,b,f,e], colors[4] || colors[1] || colors[0]);
}
function panelX(x,y0,y1,z0,z1,color) {
  surface([[x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0]],color);
}
function panelZ(z,x0,x1,y0,y1,color) {
  surface([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],color);
}
function pyramid(x,y,z,rad,height,colors) {
  const a=[x-rad,y,z-rad], b=[x+rad,y,z-rad], c=[x+rad,y,z+rad], d=[x-rad,y,z+rad], tip=[x,y+height,z];
  surface([a,b,tip],colors[0]);surface([b,c,tip],colors[1]);surface([c,d,tip],colors[2]);surface([d,a,tip],colors[3]);
}
function label(text, xyz, style = {}) { markings.push({text,xyz,style,depth:depth(xyz)}); }
function setStage() {
  faces.length=0;markings.length=0;
  // Original pastel block-style room, intentionally open at the front.
  box(0,-.22,0,12.6,.25,10.65,["#f8e8d8","#e8cbb5","#ddc4a9","#e6c9ad"]);
  box(0,0,-5.12,12.6,4.35,.20,["#fff9ef","#fff8e9","#f5ecde","#e7f3e9"]);
  box(-6.25,0,0,.20,4.35,10.5,["#eef9f1","#e4f4e8","#e0eee1","#e9f6ec"]);
  // Floor inset and playful rug.
  surface([[-6.0,.009,-4.95],[6,.009,-4.95],[6,.009,5.1],[-6,.009,5.1]],"#f4dec6");
  surface([[-3.9,.02,2.1],[2.8,.02,2.1],[2.8,.02,4.75],[-3.9,.02,4.75]],"#f6cfda");
  surface([[-3.55,.022,2.4],[2.45,.022,2.4],[2.45,.022,4.4],[-3.55,.022,4.4]],"#ffe7eb");
  // Left-side window with pane accents.
  panelX(-6.10,1.65,3.8,-2.85,.3,"#d0ebe7");
  panelX(-6.08,1.78,3.67,-2.7,.13,"#b6dfe5");
  box(-6.06,1.74,-1.35,.08,1.93,.10,["#fffdf7","#fffdf7"]);
  box(-6.06,2.61,-1.32,.08,.10,3.0,["#fffdf7","#fffdf7"]);
  // Blackboard, frame, chalk and title.
  box(-.06,1.47,-4.90,6.05,2.30,.18,["#cba68a","#d7b496","#c1a081"]);
  panelZ(-4.79,-2.88,2.74,1.64,3.57,"#477e69");
  box(-.10,1.39,-4.76,6.00,.11,.35,["#f4d6af","#d9b18e","#c9a07d"]);
  label(state.level==="m4"?"p  →  q":"2³ × 2²",[-.13,2.72,-4.69],{size:20,color:"#f4fff5",weight:800});
  label("YING  ♥  MATH",[-.06,3.32,-4.69],{size:12,color:"#d7f2dc",weight:800});
  // Floral banner and cube decorations above board.
  for(let i=0;i<6;i++){const x=-4.85+i*1.8;pyramid(x,4.22,-5.12,.11,.18,["#e4adbc","#d5a1ae","#e8b6c1","#d09baa"]);}
  // Short bookshelf along left wall.
  box(-4.85,.01,-3.5,1.45,1.65,1.22,["#e3c49a","#d4a982","#c89b75"]);
  box(-4.85,.76,-3.49,1.52,.12,1.28,["#ffe7c0","#e4bd92","#d4aa7a"]);
  for(let i=0;i<5;i++){
    box(-5.42+i*.28,.92,-3.47,.18,.57,.55,["#c4d9eb","#8eb3d2","#91abc7"]);
  }
  // Colorful book storage + plant.
  box(5.08,.01,-3.78,1.55,1.16,.92,["#f4d3c6","#ddaaa0","#c68f8e"]);
  for(let i=0;i<3;i++){box(4.7+i*.34,1.16,-3.78,.20,.38,.36,["#e8e2fa","#b6a4de","#ac98d2"]);}
  box(-4.55,0,3.98,.88,.70,.8,["#c5a17f","#ac7a63","#b18469"]);
  pyramid(-4.55,.7,3.95,.65,1.35,["#a8d7af","#83c3a3","#6fa98f","#b4d7a2"]);
  pyramid(-4.55,1.25,3.95,.48,1.02,["#afdcc0","#91caaa","#84bb99","#9dd1ad"]);
  // Teacher's desk.
  box(3.95,.73,-3.0,2.16,.22,1.18,["#efd7b2","#d4b18d","#c9a27d"]);
  for(const offset of [-.82,.82])box(3.95+offset,0,-3,.16,.76,.15,["#c6a484","#ac846f","#99735d"]);
  box(3.6,.98,-3.02,.59,.06,.39,["#fff8fa","#e9d5dd","#e7c7d0"]);
  box(4.34,.98,-3.13,.20,.39,.21,["#f3dac0","#dfa79c","#d69a8b"]);
  pyramid(4.34,1.37,-3.13,.31,.50,["#9ad2a7","#7db99d","#6cad96","#a6d7b9"]);
  avatar(2.86,0,-3.10, {shirt:["#b6d5c4","#91bea9","#85b69c"],pants:["#856c76","#755c65","#66545d"],accent:"#6d9c82"},true);
  // Student desks and chairs: empty preview furniture, not actual student presence.
  const deskLocations=[[-3.65,-1.15],[-.15,-1.15],[-3.65,1.34],[-.15,1.34],[2.65,1.34]];
  for(const [x,z] of deskLocations){
    box(x,.78,z,2.2,.20,1.08,["#e4bb98","#c99a7e","#bf8b71"]);
    for(const side of [-.8,.8])box(x+side,0,z-.05,.15,.79,.15,["#b89583","#a07d6d","#977363"]);
    box(x,.04,z+.98,1.10,.65,.24,["#c5dfd1","#9fc8b6","#8ab6a0"]);
    box(x,.38,z+.68,1.10,.12,.54,["#d5e7d8","#a6cbb7","#95bea9"]);
    box(x-.35,.992,z-.05,.28,.04,.33,["#fff9ed","#f0eddf","#eee6d6"]);
  }
  // Cute activity station + score box, previews only.
  box(4.64,.02,.05,1.7,.95,1.3,["#eed8f1","#d2b1df","#c19bd3"]);
  for(let i=0;i<3;i++)box(4.1+i*.49,.98,.05,.38,.43,.38,["#ffeff5","#e9b8d2","#d8a1c0"]);
  label("GAME",[4.64,1.49,.13],{size:12,color:"#a56a97",weight:900});
  box(4.55,.03,3.33,1.25,.95,1.16,["#ecdfeb","#bcb0ce","#b4a2c6"]);
  box(4.55,.99,3.33,.74,.15,.85,["#fff6f8","#dfc9d4","#d3baca"]);
  label("★",[4.55,1.40,3.33],{size:18,color:"#a38cb1",weight:900});
  // Preview avatar, visibly NOT another student account.
  avatar(-1.30,0,3.64,outfits[state.outfit],false);
}
function avatar(x,y,z,colors,isTeacher) {
  const h0=y;
  // Block character, intentionally original and toy-like.
  box(x-.22,h0,z,.32,.64,.40,colors.pants);
  box(x+.22,h0,z,.32,.64,.40,colors.pants);
  box(x,h0+.64,z,1.05,.94,.64,colors.shirt);
  box(x-.67,h0+.65,z,.29,.86,.49,colors.shirt);
  box(x+.67,h0+.65,z,.29,.86,.49,colors.shirt);
  box(x,h0+1.56,z,.72,.68,.66,["#f7d0b3","#e3ae96","#e7b79b"]);
  box(x,h0+2.12,z-.02,.79,.20,.70,["#5d4b4b","#423b42","#473b42"]);
  box(x-.30,h0+1.82,z+.30,.12,.10,.04,["#453f48","#453f48"]);
  box(x+.30,h0+1.82,z+.30,.12,.10,.04,["#453f48","#453f48"]);
  if(isTeacher)box(x,h0+1.39,z+.35,.34,.18,.1,["#f9f6ec","#f5ead6"]);
  else box(x,h0+1.15,z+.34,.30,.13,.12,[colors.accent,colors.accent]);
}
function drawWorld() {
  if(!ctx)return;
  setStage();
  const w=state.width,h=state.height;
  ctx.fillStyle="#fff9f2";ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w*.51,h*.38,w*.06,w*.51,h*.55,w*.68);
  glow.addColorStop(0,"#fffefb");glow.addColorStop(1,"#f7eee9");
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  // Soft shadow under floating open-dollhouse floor.
  ctx.fillStyle="#6c77691a";
  ctx.beginPath();ctx.ellipse(w*.50,h*.85,w*.36,h*.105,0,0,Math.PI*2);ctx.fill();
  faces.sort((a,b)=>a.depth-b.depth);
  for(const f of faces){
    const ps=f.points.map(project);
    ctx.beginPath();ctx.moveTo(ps[0].x,ps[0].y);
    for(let i=1;i<ps.length;i++)ctx.lineTo(ps[i].x,ps[i].y);
    ctx.closePath();ctx.fillStyle=f.fill;ctx.fill();
    ctx.strokeStyle=f.edge||"#6f867113";ctx.lineWidth=.72;ctx.stroke();
  }
  for(const item of markings){
    const p=project(item.xyz);
    const size=clamp((item.style.size||13)*state.scale/43,9,25);
    ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font=(item.style.weight||700)+" "+size+"px sans-serif";
    ctx.fillStyle=item.style.color||"#486c55";ctx.fillText(item.text,p.x,p.y);ctx.restore();
  }
  // Tiny sparkles float above the toy scene — deterministic, no animation or tracking.
  const dots=[[-5.7,3.85,3.8],[4.75,3.86,1.92],[-3.16,3.15,-.1]];
  ctx.fillStyle="#e9bbce";
  for(const d of dots){const p=project(d);ctx.beginPath();ctx.arc(p.x,p.y,3.0,0,Math.PI*2);ctx.fill();}
  placeTargets();
}
function placeTargets(){
  for(const h of hotspots){
    const pos=project(h.xyz),button=document.getElementById(h.id);
    const w=state.width,ht=state.height;
    button.style.left=clamp(pos.x/w*100,12,88)+"%";
    button.style.top=clamp(pos.y/ht*100,16,79)+"%";
  }
  const pos=project([-1.3,2.35,3.65]);
  dom.avatar.style.left=clamp(pos.x/state.width*100,15,85)+"%";
  dom.avatar.style.top=clamp(pos.y/state.height*100,16,77)+"%";
}
function resize(){
  const rect=viewport.getBoundingClientRect();
  state.width=Math.max(260,rect.width);
  state.height=Math.max(280,rect.height);
  state.scale=Math.min(state.width/15.8,state.height/10.4)*.92;
  if(ctx){
    const ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(state.width*ratio);
    canvas.height=Math.round(state.height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    drawWorld();
  }
}
function updateLevel(value){
  if(!content[value])return;
  state.level=value;
  const c=content[value];
  dom.subtitle.textContent=c.subtitle;dom.boardTag.textContent=c.board;
  dom.lesson.href=c.lesson;
  dom.gameDesc.textContent=c.gameDescription;
  if(c.game){
    dom.game.href=c.game;
    dom.game.setAttribute("aria-label","เปิดเกมคณิตศาสตร์");
  }else{
    dom.game.removeAttribute("href");
    dom.game.setAttribute("aria-label","เกมสำหรับ ม.2 ยังไม่เปิด");
  }
  for(const b of document.querySelectorAll("[data-level]")){
    const active=b.dataset.level===value;
    b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));
  }
  drawWorld();
}
function showNotice(title,message){
  dom.noticeTitle.textContent=title;
  dom.noticeMessage.textContent=message;
  if(!dom.notice.open)dom.notice.showModal();
}
document.querySelectorAll("[data-level]").forEach(btn=>btn.addEventListener("click",()=>updateLevel(btn.dataset.level)));
document.getElementById("scoreButton").addEventListener("click",()=>showNotice("สมุดคะแนนกำลังเตรียม","เมื่อตรวจสิทธิ์ระบบบัญชีนักเรียนเรียบร้อยแล้ว นักเรียนจะดูได้เฉพาะคะแนนของตนเอง ขณะนี้ยังไม่มีข้อมูลคะแนนจริง"));
document.getElementById("hotspotScore").addEventListener("click",()=>document.getElementById("scoreButton").click());
document.getElementById("hotspotTeacher").addEventListener("click",()=>showNotice("ครูพี่หญิงยินดีต้อนรับ ♡","ยินดีต้อนรับสู่ห้องเรียนคณิตศาสตร์ ม.2 และ ม.4 นะคะ เลือกบทเรียนหรือมุมเกมเพื่อเริ่มเรียนได้เลยค่ะ"));
document.getElementById("hotspotLesson").addEventListener("click",()=>{window.location.assign(dom.lesson.href);});
document.getElementById("hotspotGame").addEventListener("click",()=>{
  if(content[state.level].game)window.location.assign(dom.game.href);
  else showNotice("เกม ม.2 กำลังเตรียม","ขณะนี้มีเกมตรรกศาสตร์สำหรับ ม.4 ส่วนเกมเลขยกกำลัง ม.2 ยังไม่ได้เผยแพร่");
});
dom.game.addEventListener("click",e=>{
  if(content[state.level].game)return;
  e.preventDefault();showNotice("เกม ม.2 กำลังเตรียม","ขณะนี้มีเกมตรรกศาสตร์สำหรับ ม.4 ส่วนเกมเลขยกกำลัง ม.2 ยังไม่ได้เผยแพร่");
});
dom.changeAvatar.addEventListener("click",()=>{state.outfit=(state.outfit+1)%outfits.length;drawWorld();});
document.getElementById("closeNotice").addEventListener("click",()=>dom.notice.close());
dom.notice.addEventListener("click",event=>{if(event.target===dom.notice)dom.notice.close();});
function orbit(diff){state.yaw=clamp(state.yaw+diff,.31,1.28);drawWorld();}
document.getElementById("rotateLeft").addEventListener("click",()=>orbit(-.17));
document.getElementById("rotateRight").addEventListener("click",()=>orbit(.17));
document.getElementById("resetView").addEventListener("click",()=>{state.yaw=.71;state.pitch=.68;drawWorld();});
canvas.addEventListener("pointerdown", e=>{
  state.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove",e=>{
  const p=state.pointer;
  if(!p||p.id!==e.pointerId)return;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(Math.abs(dx)+Math.abs(dy)>2)p.dragging=true;
  if(p.dragging){
    state.yaw=clamp(state.yaw+dx*.0055,.31,1.28);
    state.pitch=clamp(state.pitch-dy*.003,.45,.88);
    viewport.classList.add("dragging");drawWorld();
  }
  p.x=e.clientX;p.y=e.clientY;
});
function endPointer(e){if(state.pointer?.id!==e.pointerId)return;state.pointer=null;viewport.classList.remove("dragging");}
canvas.addEventListener("pointerup",endPointer);
canvas.addEventListener("pointercancel",endPointer);
if(typeof ResizeObserver==="function")new ResizeObserver(resize).observe(viewport);
else window.addEventListener("resize",resize);
updateLevel("m4");
resize();
