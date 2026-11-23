/* Ying Teaching Hub Auth core: Supabase Auth REST API, teacher-only MVP.
 * Publishable key is public by design. Never put secret/service-role keys here.
 * Sessions are scoped to the current browser tab; roles come from RLS, not metadata.
 */
(function () {
  "use strict";
  const origin = "https://zutekwbsqdhcnvcppvjx.supabase.co";
  const publishableKey = "sb_publishable_14-5ToUx5e2kBPUc5-vqKA_tJUCxGxX";
  const storageKey = "ying-teaching-hub:teacher-session:v1";
  const listeners = new Set();
  let active = null;
  function validSession(s) {
    return s && typeof s.access_token === "string" && s.access_token.length > 30 &&
      typeof s.refresh_token === "string" && s.refresh_token.length > 15 &&
      typeof s.expires_at === "number" && Number.isFinite(s.expires_at);
  }
  function readSession() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      return validSession(stored) ? stored : null;
    } catch { return null; }
  }
  function setSession(s) {
    const expiresAt = Math.floor(Date.now()/1000) + Number(s.expires_in || 3600);
    const parsed = {access_token:s.access_token,refresh_token:s.refresh_token,expires_at:expiresAt};
    if (!validSession(parsed)) throw new Error("Invalid session");
    sessionStorage.setItem(storageKey, JSON.stringify(parsed));
    active = parsed;
    for(const callback of listeners) callback(Boolean(active));
  }
  function clearSession() {
    active = null;
    try { sessionStorage.removeItem(storageKey); } catch {}
    for(const callback of listeners) callback(false);
  }
  async function request(path, options = {}) {
    const {method="GET",body=null,accessToken=null} = options;
    const headers = {"apikey":publishableKey,"Accept":"application/json"};
    if(body !== null)headers["Content-Type"]="application/json";
    if(accessToken)headers["Authorization"]="Bearer "+accessToken;
    const response = await fetch(origin+path,{
      method, headers, body:body===null?undefined:JSON.stringify(body),
      cache:"no-store", credentials:"omit", referrerPolicy:"no-referrer"
    });
    let result = null;
    try { result = await response.json(); } catch {}
    if(!response.ok)throw new Error("AUTH_REQUEST_FAILED");
    return result;
  }
  async function refreshedSession() {
    let session = active || readSession();
    if(!session)return null;
    if(session.expires_at < Date.now()/1000+45){
      try {
        const tokens = await request("/auth/v1/token?grant_type=refresh_token",{
          method:"POST",body:{refresh_token:session.refresh_token}
        });
        setSession(tokens);
        session=active;
      } catch {
        clearSession();
        return null;
      }
    }
    return session;
  }
  async function currentTeacher() {
    const session=await refreshedSession();
    if(!session)return null;
    try {
      const user = await request("/auth/v1/user",{accessToken:session.access_token});
      if(!user || typeof user.id!=="string")return null;
      // RLS only allows reading the caller's own membership; no client writes.
      const rows = await request(
        "/rest/v1/classroom_memberships?select=role,display_name&user_id=eq."+
        encodeURIComponent(user.id)+"&limit=1",
        {accessToken:session.access_token}
      );
      if(!Array.isArray(rows)||rows.length!==1||rows[0].role!=="teacher")return null;
      return {id:user.id,email:user.email||"",displayName:rows[0].display_name||"ครูพี่หญิง",role:"teacher"};
    }catch{return null;}
  }
  async function signInTeacher(email,password){
    const address=String(email||"").trim().toLowerCase();
    if(!address.includes("@")||typeof password!=="string"||!password)throw new Error("INVALID_INPUT");
    try{
      const session=await request("/auth/v1/token?grant_type=password",{
        method:"POST",body:{email:address,password}
      });
      setSession(session);
      const teacher=await currentTeacher();
      if(!teacher){
        await signOut();
        throw new Error("NO_TEACHER_ACCESS");
      }
      return teacher;
    }catch(error){
      clearSession();
      if(error.message==="NO_TEACHER_ACCESS")throw error;
      throw new Error("INVALID_CREDENTIALS_OR_SERVICE");
    }
  }
  async function signOut(){
    const session=active||readSession();
    clearSession();
    if(!session)return;
    try {
      await request("/auth/v1/logout",{method:"POST",accessToken:session.access_token});
    }catch {
      // No session is retained on the device even if network revocation fails.
    }
  }
  async function changePassword(value){
    const password=String(value||"");
    if(password.length<12||password.length>72)throw new Error("PASSWORD_LENGTH");
    const session=await refreshedSession();
    if(!session||!await currentTeacher())throw new Error("NO_AUTHORIZATION");
    await request("/auth/v1/user",{
      method:"PUT",accessToken:session.access_token,body:{password}
    });
    // User remains signed in to change-password flows per Auth settings.
  }
  window.YingTeacherAuth=Object.freeze({
    currentTeacher,signInTeacher,signOut,changePassword,
    onSessionChange(callback){if(typeof callback!=="function")return()=>{};listeners.add(callback);return()=>listeners.delete(callback);}
  });
})();
