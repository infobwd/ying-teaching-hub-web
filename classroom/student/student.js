"use strict";
// Student tokens are stored in this tab only; passwords are never stored.
const URL_ROOT="https://zutekwbsqdhcnvcppvjx.supabase.co";
const PUB_KEY="sb_publishable_14-5ToUx5e2kBPUc5-vqKA_tJUCxGxX";
const STORAGE_KEY="ying-teaching-hub:student-session:v1";
const els={
  login:document.getElementById("studentLogin"),
  change:document.getElementById("firstChange"),
  dash:document.getElementById("studentDashboard"),
  status:document.getElementById("statusMessage"),
  loginButton:document.getElementById("loginButton"),
  changeButton:document.getElementById("changeButton"),
  grades:document.getElementById("gradeList"),
  greet:document.getElementById("studentGreeting")
};
let initial=null;
let busy=false;
function setBusy(v){busy=v;els.loginButton.disabled=v;els.changeButton.disabled=v;}
function notice(message,tone=""){els.status.textContent=message;els.status.className="message"+(tone?" "+tone:"");}
function onlyLogin(){initial=null;els.login.hidden=false;els.change.hidden=true;els.dash.hidden=true;
  els.login.reset();els.change.reset();}
function onlyChange(){els.login.hidden=true;els.change.hidden=false;els.dash.hidden=true;}
function onlyDashboard(name){initial=null;els.login.hidden=true;els.change.hidden=true;els.dash.hidden=false;
  els.greet.textContent="สวัสดี "+name;els.login.reset();els.change.reset();}
function validTokens(s){return Boolean(s && typeof s.access_token==="string" &&
  typeof s.refresh_token==="string" && s.access_token.length>30 && s.refresh_token.length>15 &&
  typeof s.expires_at==="number" && Number.isFinite(s.expires_at));}
function saveTokens(session){const value={access_token:session.access_token,refresh_token:session.refresh_token,
  expires_at:Math.floor(Date.now()/1000)+Number(session.expires_in||3600)};
  if(!validTokens(value))throw Error("Invalid session");sessionStorage.setItem(STORAGE_KEY,JSON.stringify(value));
  return value;
}
function eraseSession(){sessionStorage.removeItem(STORAGE_KEY);}
function loadTokens(){try{const s=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||"null");
  return validTokens(s)?s:null;}catch{return null;}}
async function api(path,options={}){
  const headers={"apikey":PUB_KEY,"Accept":"application/json"};
  if(options.body) headers["Content-Type"]="application/json";
  if(options.token) headers["Authorization"]="Bearer "+options.token;
  const response=await fetch(URL_ROOT+path,{method:options.method||"GET",headers,
    body:options.body?JSON.stringify(options.body):undefined,cache:"no-store",
    credentials:"omit",referrerPolicy:"no-referrer"});
  let data=null;try{data=await response.json()}catch{}
  if(!response.ok){const error=Error("REQUEST_FAILED");error.status=response.status;throw error;}
  return data;
}
async function edge(payload){
  const r=await fetch(URL_ROOT+"/functions/v1/yth-student-auth",{
    method:"POST",headers:{"Content-Type":"application/json","apikey":PUB_KEY},
    body:JSON.stringify(payload),cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer"
  });
  let data=null;try{data=await r.json()}catch{}
  if(!r.ok){
    if(r.status===429)throw Error("RATE_LIMIT");
    if(r.status===503)throw Error("SERVICE_UNAVAILABLE");
    if(r.status===401)throw Error("INVALID_LOGIN");
    throw Error("SIGN_IN_FAILED");
  }
  return data;
}
async function validSession(){
  let session=loadTokens();if(!session)return null;
  if(session.expires_at<Date.now()/1000+45){
    try{const result=await api("/auth/v1/token?grant_type=refresh_token",{
      method:"POST",body:{refresh_token:session.refresh_token}});
      session=saveTokens(result);
    }catch{eraseSession();return null;}
  }
  return session;
}
async function showAccount(session,displayName=""){
  const user=await api("/auth/v1/user",{token:session.access_token});
  if(!user||!user.id)throw Error("SESSION_INVALID");
  const profileRows=await api("/rest/v1/yth_student_profiles?select=given_name,family_name,must_change_password&user_id=eq."+
    encodeURIComponent(user.id)+"&limit=1",{token:session.access_token});
  if(!Array.isArray(profileRows)||profileRows.length!==1||
    profileRows[0].must_change_password)throw Error("ACCOUNT_NOT_READY");
  const name=displayName||[profileRows[0].given_name,profileRows[0].family_name].join(" ");
  onlyDashboard(name);
  notice("เข้าสู่ระบบแล้ว ดูคะแนนที่ครูเผยแพร่ได้เฉพาะบัญชีของตนเอง","success");
  void loadGrades(session,user.id);
}
async function loadGrades(session,userId){
  els.grades.textContent="กำลังโหลดคะแนน...";
  try{
    const query="/rest/v1/yth_released_results?select=attempt_id,score_points,max_points,released_at,yth_attempts!inner(learner_uid,yth_assignments(title))"+
      "&yth_attempts.learner_uid=eq."+encodeURIComponent(userId)+"&order=released_at.desc&limit=100";
    const rows=await api(query,{token:session.access_token});
    els.grades.replaceChildren();
    if(!Array.isArray(rows)||rows.length===0){
      const p=document.createElement("p");p.className="no-grade";
      p.textContent="ยังไม่มีคะแนนที่ครูเผยแพร่";els.grades.append(p);return;
    }
    for(const grade of rows){
      const wrap=document.createElement("div");wrap.className="grade-item";
      const title=document.createElement("span");title.className="grade-title";
      title.textContent=grade.yth_attempts?.yth_assignments?.title||"กิจกรรมการเรียนรู้";
      const points=document.createElement("strong");points.className="grade-number";
      const got=Number(grade.score_points),maximum=Number(grade.max_points);
      points.textContent=Number.isFinite(got)&&Number.isFinite(maximum)
        ?got+" / "+maximum:"—";
      wrap.append(title,points);els.grades.append(wrap);
    }
  }catch{
    els.grades.textContent="ไม่สามารถโหลดคะแนนได้ กรุณาลองเข้าสู่ระบบใหม่ในภายหลัง";
  }
}
els.login.addEventListener("submit",async(event)=>{
  event.preventDefault();if(busy)return;
  const studentId=document.getElementById("studentId").value.trim();
  const password=document.getElementById("studentPassword").value;
  if(!/^[0-9]{3,16}$/.test(studentId))return notice("กรุณากรอกรหัสนักเรียน 3–16 หลัก","error");
  setBusy(true);notice("กำลังตรวจสอบข้อมูล...");
  try{
    const data=await edge({action:"login",studentId,password});
    if(data.mustChangePassword){
      initial={studentId,password};onlyChange();
      document.getElementById("studentPassword").value="";
      notice("เข้าใช้ครั้งแรก: กรุณาตั้งรหัสผ่านใหม่ก่อนดูข้อมูลส่วนตัว");
      return;
    }
    const session=saveTokens(data.session);
    await showAccount(session,[data.student?.givenName,data.student?.familyName].filter(Boolean).join(" "));
  }catch(error){
    if(error.message==="RATE_LIMIT")notice("ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาที","error");
    else if(error.message==="SERVICE_UNAVAILABLE")notice("ระบบล็อกอินไม่พร้อมใช้งานชั่วคราว กรุณาลองอีกครั้ง","error");
    else notice("รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่พร้อมใช้งาน","error");
    eraseSession();
  }finally{document.getElementById("studentPassword").value="";setBusy(false);}
});
els.change.addEventListener("submit",async(event)=>{
  event.preventDefault();if(busy||!initial)return;
  const newPassword=document.getElementById("newPassword").value;
  const confirm=document.getElementById("confirmPassword").value;
  if(newPassword!==confirm)return notice("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน","error");
  if(newPassword.length<12||newPassword.length>72)return notice("ใช้รหัสผ่านความยาว 12–72 ตัวอักษร","error");
  setBusy(true);notice("กำลังเปลี่ยนรหัสผ่าน...");
  try{
    const data=await edge({action:"first_change",studentId:initial.studentId,
      password:initial.password,newPassword});
    const session=saveTokens(data.session);
    initial=null;await showAccount(session,[data.student?.givenName,data.student?.familyName].filter(Boolean).join(" "));
    notice("เปลี่ยนรหัสผ่านและเข้าสู่ระบบเรียบร้อยแล้ว","success");
  }catch(error){
    if(error.message==="RATE_LIMIT")notice("ลองบ่อยเกินไป กรุณารอ 15 นาที","error");
    else if(error.message==="SERVICE_UNAVAILABLE")notice("ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้ หากเปลี่ยนแล้วให้ลองเข้าด้วยรหัสใหม่","error");
    else notice("ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่หรือติดต่อครู","error");
  }finally{document.getElementById("newPassword").value="";document.getElementById("confirmPassword").value="";setBusy(false);}
});
document.getElementById("cancelChange").addEventListener("click",()=>{
  onlyLogin();notice("กรุณาเข้าสู่ระบบอีกครั้ง");
});
document.getElementById("logout").addEventListener("click",async()=>{
  if(busy)return;setBusy(true);
  const session=loadTokens();eraseSession();onlyLogin();
  if(session){try{await api("/auth/v1/logout",{method:"POST",token:session.access_token});}catch{}}
  notice("ออกจากระบบเรียบร้อยแล้ว","success");setBusy(false);
});
(async()=>{
  try{const session=await validSession();if(session)await showAccount(session);}
  catch{eraseSession();onlyLogin();notice("กรุณาเข้าสู่ระบบเพื่อดูข้อมูลส่วนตัว");}
})();