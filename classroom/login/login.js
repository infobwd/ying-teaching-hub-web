"use strict";
const form=document.getElementById("loginForm");
const dashboard=document.getElementById("dashboard");
const message=document.getElementById("feedback");
const loginButton=document.getElementById("submitLogin");
const changeForm=document.getElementById("changeForm");
let busy=false;
function feedback(text,tone=""){
  message.textContent=text;
  message.className="feedback"+(tone?" "+tone:"");
}
function setBusy(value){
  busy=value;loginButton.disabled=value;
  loginButton.textContent=value?"กำลังตรวจสอบ...":"เข้าสู่ระบบ";
  const changeBtn=document.getElementById("changePasswordButton");
  changeBtn.disabled=value;
}
function showTeacher(teacher){
  dashboard.hidden=false;
  form.hidden=true;
  document.getElementById("welcomeTeacher").textContent=
    "สวัสดี "+teacher.displayName;
  feedback("ลงชื่อเข้าใช้และตรวจสอบสิทธิ์ครูเรียบร้อยแล้ว","success");
}
function showGuest(){
  form.hidden=false;dashboard.hidden=true;
  form.reset();changeForm.reset();
}
form.addEventListener("submit",async(event)=>{
  event.preventDefault();
  if(busy)return;
  setBusy(true);feedback("กำลังตรวจสอบบัญชีครู...");
  try{
    const email=document.getElementById("email").value;
    const password=document.getElementById("password").value;
    const teacher=await window.YingTeacherAuth.signInTeacher(email,password);
    showTeacher(teacher);
  }catch(error){
    if(error.message==="NO_TEACHER_ACCESS")
      feedback("บัญชีนี้ยังไม่ได้รับสิทธิ์ครู กรุณาติดต่อผู้ดูแลระบบ","error");
    else feedback("เข้าสู่ระบบไม่ได้ กรุณาตรวจสอบบัญชีและรหัสผ่าน หรือตรวจสอบสถานะระบบ","error");
  }finally{document.getElementById("password").value="";setBusy(false);}
});
document.getElementById("logout").addEventListener("click",async()=>{
  if(busy)return;
  setBusy(true);
  await window.YingTeacherAuth.signOut();
  showGuest();feedback("ออกจากระบบเรียบร้อยแล้ว","success");
  setBusy(false);
});
changeForm.addEventListener("submit",async(event)=>{
  event.preventDefault();if(busy)return;
  const first=document.getElementById("newPassword").value;
  const second=document.getElementById("confirmPassword").value;
  if(first!==second){feedback("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน","error");return;}
  if(first.length<12){feedback("รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร","error");return;}
  setBusy(true);
  try{
    await window.YingTeacherAuth.changePassword(first);
    changeForm.reset();
    feedback("เปลี่ยนรหัสผ่านสำเร็จแล้ว","success");
  }catch{feedback("ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ","error");}
  finally{setBusy(false);}
});
(async()=>{
  try{
    const teacher=await window.YingTeacherAuth.currentTeacher();
    if(teacher)showTeacher(teacher);
  }catch{
    feedback("ยังตรวจสอบบัญชีไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ");
  }
})();
