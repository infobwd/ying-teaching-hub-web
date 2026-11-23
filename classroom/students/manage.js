"use strict";
const PROJECT_URL="https://zutekwbsqdhcnvcppvjx.supabase.co";
const PUB="sb_publishable_14-5ToUx5e2kBPUc5-vqKA_tJUCxGxX";
const auth=window.YingTeacherAuth;
const status=document.getElementById("manageStatus");
const form=document.getElementById("studentForm");
const credential=document.getElementById("credential");
const action=document.getElementById("provision");
let teacher=null,locked=false;
function message(text,error=false){status.textContent=text;status.className="feedback"+(error?" error":"");}
function eraseTemp(){
  document.getElementById("createdId").value="";
  document.getElementById("createdPassword").value="";
  credential.hidden=true;
  if(teacher)form.hidden=false;
}
function setBusy(value){locked=value;action.disabled=value;action.textContent=value?"กำลังสร้างบัญชี...":"สร้างบัญชีและรหัสผ่านเริ่มต้น";}
async function getToken(){return await auth.teacherAccessToken();}
async function fetchClasses(){
  const token=await getToken();
  if(!token)throw Error("NO_TEACHER");
  const response=await fetch(PROJECT_URL+"/rest/v1/yth_classes?select=id,title&active=is.true&teacher_uid=eq."+
    encodeURIComponent(teacher.id)+"&order=title.asc",{
    headers:{"apikey":PUB,"Authorization":"Bearer "+token},
    credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer"
  });
  if(!response.ok)throw Error("CLASSES_UNAVAILABLE");
  const classes=await response.json();
  if(!Array.isArray(classes)||classes.length===0){
    message("ยังไม่มีห้องเรียนที่เปิดใช้งานหรือได้รับมอบหมายให้ครู กรุณาตั้งค่าห้องเรียนก่อนสร้างบัญชีนักเรียน");
    return;
  }
  const selector=document.getElementById("classId");
  for(const cls of classes){
    const opt=document.createElement("option");opt.value=cls.id;opt.textContent=cls.title;
    selector.append(opt);
  }
  form.hidden=false;message("ตรวจสอบสิทธิ์ครูเรียบร้อย เลือกห้องเรียนเพื่อเพิ่มนักเรียน");
}
form.addEventListener("submit",async(e)=>{
  e.preventDefault();if(locked||!teacher)return;
  const studentId=document.getElementById("studentIdInput").value.trim();
  const givenName=document.getElementById("givenName").value.trim();
  const familyName=document.getElementById("familyName").value.trim();
  const classId=document.getElementById("classId").value;
  if(!/^[0-9]{3,16}$/.test(studentId)||!classId||!givenName||!familyName)
    return message("ตรวจสอบเลขประจำตัว ห้อง ชื่อ และนามสกุลก่อนดำเนินการ",true);
  setBusy(true);message("กำลังสร้างบัญชีนักเรียน...");
  try{
    const token=await getToken();if(!token)throw Error("NO_TEACHER");
    const response=await fetch(PROJECT_URL+"/functions/v1/yth-student-auth",{
      method:"POST",headers:{"Content-Type":"application/json","apikey":PUB,
        "Authorization":"Bearer "+token},
      body:JSON.stringify({action:"provision",studentId,givenName,familyName,classId}),
      cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer"
    });
    if(!response.ok)throw Error(response.status===409?"DUPLICATE":"REGISTER_FAILED");
    const record=await response.json();
    if(!record.provisioned||typeof record.tempPassword!=="string")throw Error("REGISTER_FAILED");
    document.getElementById("createdId").value=record.studentId;
    document.getElementById("createdPassword").value=record.tempPassword;
    credential.hidden=false;form.hidden=true;form.reset();
    message("สร้างบัญชีสำเร็จ ส่งรหัสเริ่มต้นให้นักเรียนเป็นการส่วนตัว แล้วล้างรหัสออกจากหน้าจอ");
  }catch(err){
    if(err.message==="DUPLICATE")message("รหัสนักเรียนนี้มีบัญชีในระบบแล้ว กรุณาตรวจสอบก่อนเพิ่มซ้ำ",true);
    else message("สร้างบัญชีไม่สำเร็จ กรุณาตรวจสอบสิทธิ์หรือการเชื่อมต่อ",true);
  }finally{setBusy(false);}
});
document.getElementById("closeCredential").addEventListener("click",eraseTemp);
document.getElementById("copyCredentials").addEventListener("click",async()=>{
  const id=document.getElementById("createdId").value;
  const pass=document.getElementById("createdPassword").value;
  if(!id||!pass)return;
  try{await navigator.clipboard.writeText("รหัสประจำตัวนักเรียน: "+id+"\nรหัสผ่านเริ่มต้น: "+pass+
      "\nเปิดเว็บ: https://infobwd.github.io/ying-teaching-hub-web/classroom/student/");
    message("คัดลอกแล้ว กรุณาส่งให้นักเรียนเป็นการส่วนตัวและลบรหัสจากคลิปบอร์ดหลังใช้งาน");
  }catch{message("ไม่สามารถคัดลอกได้ กรุณาจดหรือส่งข้อมูลโดยตรงอย่างปลอดภัย",true);}
});
(async()=>{
  try{
    teacher=await auth.currentTeacher();
    if(!teacher){message("กรุณาเข้าสู่ระบบด้วยบัญชีครูที่ได้รับสิทธิ์ก่อน",true);return;}
    await fetchClasses();
  }catch{message("ไม่สามารถตรวจสอบสิทธิ์หรือโหลดห้องเรียนได้ กรุณาลองเข้าสู่ระบบอีกครั้ง",true);}
})();
