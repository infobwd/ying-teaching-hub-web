"use strict";
(function(){
  const link=document.getElementById("teacherLoginLink");
  const status=document.getElementById("teacherAuthState");
  if(!link||!status||!window.YingTeacherAuth)return;
  async function refreshState(){
    try{
      const teacher=await window.YingTeacherAuth.currentTeacher();
      if(teacher){
        link.textContent="บัญชีครู";
        status.textContent="ครูลงชื่อเข้าใช้แล้ว · เฉพาะเครื่องนี้";
        status.classList.add("signed-in");
      }else{
        link.textContent="เข้าสู่ระบบครู";
        status.textContent="ผู้เยี่ยมชม";
        status.classList.remove("signed-in");
      }
    }catch{
      status.textContent="ยังตรวจสอบสถานะไม่ได้";
      status.classList.remove("signed-in");
    }
  }
  window.YingTeacherAuth.onSessionChange(()=>{void refreshState();});
  void refreshState();
})();
