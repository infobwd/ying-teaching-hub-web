"use strict";
(function(){
 const root="https://zutekwbsqdhcnvcppvjx.supabase.co";
 const key="sb_publishable_14-5ToUx5e2kBPUc5-vqKA_tJUCxGxX";
 const form=document.getElementById("setupForm");
 const hint=document.getElementById("accountHint");
 const feedback=document.getElementById("setupMessage");
 const save=document.getElementById("savePassword");
 const fragment=new URLSearchParams(location.hash.slice(1));
 const token=fragment.get("access_token");
 const kind=fragment.get("type");
 // Remove all tokens from address bar and browser history before rendering UI.
 if(location.hash)history.replaceState(null,"",location.pathname);
 let authorized=false;
 const fail=(text)=>{feedback.textContent=text;feedback.className="feedback error";form.hidden=true;};
 const note=(text)=>{feedback.textContent=text;feedback.className="feedback";};
 async function request(path,method,body){
  const response=await fetch(root+path,{method,headers:{"apikey":key,
   "Authorization":"Bearer "+token,"Content-Type":"application/json",
   "Accept":"application/json"},body:body?JSON.stringify(body):undefined,
   cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer"});
  if(!response.ok)throw Error("REQUEST_FAILED");
  return await response.json().catch(()=>null);
 }
 (async()=>{
  if(!token||token.length<30||!["invite","recovery"].includes(kind)){
   hint.textContent="ไม่พบคำเชิญที่ใช้ได้";
   return fail("กรุณาเปิดลิงก์ล่าสุดจากอีเมลคำเชิญของ Supabase หากลิงก์หมดอายุให้ผู้ดูแลส่งใหม่");
  }
  try{
   const user=await request("/auth/v1/user","GET");
   if(!user||!user.id||!user.email)throw Error("USER_INVALID");
   authorized=true;hint.textContent="บัญชี "+user.email+" · กรุณากำหนดรหัสผ่านใหม่";
   form.hidden=false;note("กรุณาตั้งรหัสผ่านส่วนตัว ไม่ต้องส่งรหัสผ่านให้ผู้ดูแล");
  }catch{
   hint.textContent="ตรวจสอบคำเชิญไม่สำเร็จ";
   fail("ลิงก์เชิญอาจหมดอายุหรือถูกใช้แล้ว กรุณาขอคำเชิญใหม่");
  }
 })();
 form.addEventListener("submit",async(event)=>{
  event.preventDefault();if(!authorized||save.disabled)return;
  const password=document.getElementById("newPassword").value;
  const confirm=document.getElementById("confirmPassword").value;
  if(password.length<12||password.length>72){note("รหัสผ่านต้องมี 12–72 ตัวอักษร");return;}
  if(password!==confirm){note("รหัสผ่านสองช่องไม่ตรงกัน");return;}
  save.disabled=true;note("กำลังตั้งรหัสผ่าน...");
  try{
   await request("/auth/v1/user","PUT",{password});
   form.reset();form.hidden=true;authorized=false;
   hint.textContent="ตั้งรหัสผ่านสำเร็จ";
   feedback.className="feedback success";
   feedback.textContent="ตั้งรหัสผ่านเรียบร้อยแล้ว กรุณารอให้ผู้ดูแลยืนยันสิทธิ์ครู แล้วเข้าสู่ระบบด้วยอีเมลและรหัสผ่านใหม่";
   try{await request("/auth/v1/logout","POST");}catch{}
  }catch{note("ไม่สามารถตั้งรหัสผ่านได้ กรุณาตรวจสอบลิงก์เชิญหรือขอใหม่");}
  finally{save.disabled=false;}
 });
})();