// Ying Teaching Hub student auth: private ID->Auth mapping, unique credentials,
// anonymous login throttling, and teacher-only student provisioning.
// IMPORTANT: Public function; actions validate their own identity/permissions.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const api = Deno.env.get("SUPABASE_URL") || "";
const publicKey = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default || "";
const secretKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || "";
const allowedOrigin = "https://infobwd.github.io";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type,authorization,apikey",
  "Access-Control-Max-Age": "600",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};
const studentIdValid = (v: unknown) => typeof v === "string" && /^[0-9]{3,16}$/.test(v);
const uuidValid = (v: unknown) => typeof v === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const safeName = (v: unknown) => typeof v === "string" && v.trim().length >= 1 && v.trim().length <= 100;
const reply = (status: number, data: Record<string, unknown>) =>
  new Response(JSON.stringify(data), {status, headers:cors});
function randomPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, n=>alphabet[n % alphabet.length]).join("");
}
async function sha(input: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(bytes)).map(n=>n.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:cors});
  if (req.method !== "POST") return reply(405,{error:"Method not allowed"});
  const origin = req.headers.get("origin");
  if (origin && origin !== allowedOrigin) return reply(403,{error:"Origin not allowed"});
  if (!api || !publicKey || !secretKey) return reply(503,{error:"Authentication configuration unavailable"});
  const size = Number(req.headers.get("content-length") || "0");
  if (size > 4096) return reply(413,{error:"Request too large"});
  const inputText = await req.text();
  if (inputText.length > 4096) return reply(413,{error:"Request too large"});
  let input: Record<string, unknown>;
  try { input = JSON.parse(inputText); if(!input || typeof input !== "object" || Array.isArray(input)) throw 0; }
  catch { return reply(400,{error:"Invalid request"}); }
  const publicClient = createClient(api, publicKey,
    {auth:{persistSession:false,autoRefreshToken:false}});
  const admin = createClient(api, secretKey,
    {auth:{persistSession:false,autoRefreshToken:false}});
  const action = input.action;
  if (action === "login" || action === "first_change") {
    if(!studentIdValid(input.studentId) || typeof input.password !== "string"
       || input.password.length < 1 || input.password.length > 256)
       return reply(400,{error:"Invalid sign-in information"});
    if(action === "first_change" &&
      (typeof input.newPassword !== "string" || input.newPassword.length < 12
       || input.newPassword.length > 72 || input.newPassword === input.password))
      return reply(400,{error:"New password must contain 12-72 characters and differ from the old password"});
    // A per-student throttle cannot be bypassed by changing network headers.
    // A second network-wide throttle limits mass ID guessing.
    const studentHash=await sha("student:"+input.studentId);
    const remoteAddress=req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";
    const networkHash=await sha("network:"+remoteAddress);
    const {data:permitted,error:guardErr} = await admin.rpc(
      "yth_student_login_guard",{p_student_hash:studentHash,p_network_hash:networkHash});
    if(guardErr) return reply(503,{error:"Sign-in is temporarily unavailable"});
    if(!permitted) return reply(429,{error:"Too many attempts. Please try again in 15 minutes"});
    const {data:alias,error:aliasErr}=await admin.rpc("yth_student_login_lookup",
      {p_student_id:input.studentId});
    if(aliasErr) return reply(503,{error:"Sign-in is temporarily unavailable"});
    // Unknown IDs still go through Auth to reduce account enumeration.
    const email=(typeof alias === "string" && alias.length > 0)
      ? alias : "not-an-account@students.example.org";
    const {data:auth,error:signErr}=await publicClient.auth.signInWithPassword({
      email,password:input.password as string
    });
    if(signErr || !auth.user || !auth.session) return reply(401,{error:"Student ID or password is incorrect"});
    const [profileResult,roleResult]=await Promise.all([
      admin.from("yth_student_profiles").select("student_id,given_name,family_name,must_change_password")
        .eq("user_id",auth.user.id).maybeSingle(),
      admin.from("yth_user_roles").select("role").eq("user_id",auth.user.id).maybeSingle()
    ]);
    const profile=profileResult.data;
    if(profileResult.error||roleResult.error||roleResult.data?.role!=="learner" ||
       !profile || profile.student_id!==input.studentId) {
      return reply(401,{error:"Student ID or password is incorrect"});
    }
    if (profile.must_change_password) {
      if (action === "login") return reply(200,{mustChangePassword:true});
      const updated=await admin.auth.admin.updateUserById(auth.user.id,
        {password:input.newPassword as string});
      if(updated.error) return reply(503,{error:"Password change unavailable"});
      const dbUpdate=await admin.from("yth_student_profiles").update({must_change_password:false})
        .eq("user_id",auth.user.id);
      if(dbUpdate.error)return reply(503,{error:"Password changed; please contact the teacher if sign-in remains unavailable"});
      const newSignIn=await publicClient.auth.signInWithPassword({
        email,password:input.newPassword as string
      });
      if(newSignIn.error || !newSignIn.data.session)
        return reply(503,{error:"Password changed. Please sign in using your new password"});
      return reply(200,{mustChangePassword:false,session:{
        access_token:newSignIn.data.session.access_token,
        refresh_token:newSignIn.data.session.refresh_token,
        expires_in:newSignIn.data.session.expires_in
      },student:{givenName:profile.given_name,familyName:profile.family_name}});
    }
    if (action === "first_change") return reply(409,{error:"Password has already been changed; please sign in"});
    return reply(200,{mustChangePassword:false,session:{
      access_token:auth.session.access_token,
      refresh_token:auth.session.refresh_token,
      expires_in:auth.session.expires_in
    },student:{givenName:profile.given_name,familyName:profile.family_name}});
  }
  if (action === "provision") {
    // Only a verified Auth user who is the assigned teacher of this active class.
    const bearer=req.headers.get("authorization") || "";
    if(!/^Bearer\s+\S+$/i.test(bearer))return reply(401,{error:"Not authorized"});
    const {data:who,error:whoErr}=await publicClient.auth.getUser(bearer.replace(/^Bearer\s+/i,""));
    if(whoErr || !who.user) return reply(401,{error:"Not authorized"});
    const [roleRes,classRes]=await Promise.all([
      admin.from("yth_user_roles").select("role").eq("user_id",who.user.id).maybeSingle(),
      uuidValid(input.classId)
      ? admin.from("yth_classes").select("id,teacher_uid,active")
          .eq("id",input.classId).maybeSingle()
      : Promise.resolve({data:null,error:null})
    ]);
    if(roleRes.error || !["teacher","admin"].includes(roleRes.data?.role||"") ||
       classRes.error || !classRes.data || !classRes.data.active ||
       classRes.data.teacher_uid!==who.user.id)return reply(403,{error:"Not authorized for this class"});
    if(!studentIdValid(input.studentId) || !safeName(input.givenName) ||
       !safeName(input.familyName))return reply(400,{error:"Invalid student record"});
    const existing=await admin.from("yth_student_profiles").select("user_id")
      .eq("student_id",input.studentId).limit(1);
    if(existing.error)return reply(503,{error:"Student registration unavailable"});
    if((existing.data||[]).length) return reply(409,{error:"Student ID is already registered"});
    const password=randomPassword();
    const opaqueEmail="student-"+crypto.randomUUID()+"@students.example.org";
    const created=await admin.auth.admin.createUser({email:opaqueEmail,password,email_confirm:true});
    if(created.error || !created.data.user) return reply(503,{error:"Student registration unavailable"});
    const uid=created.data.user.id;
    try {
      const profile=await admin.from("yth_student_profiles").insert({
        user_id:uid,student_id:input.studentId,given_name:(input.givenName as string).trim(),
        family_name:(input.familyName as string).trim(),must_change_password:true});
      if(profile.error)throw profile.error;
      const role=await admin.from("yth_user_roles").insert({user_id:uid,role:"learner"});
      if(role.error)throw role.error;
      const member=await admin.from("yth_class_memberships").insert({
        class_id:input.classId,learner_uid:uid,status:"active"});
      if(member.error)throw member.error;
      const alias=await admin.rpc("yth_student_register_login_alias",{
        p_student_id:input.studentId,p_login_email:opaqueEmail
      });
      if(alias.error)throw alias.error;
      // This temporary password is returned once, only to the verified teacher.
      return reply(201,{studentId:input.studentId,tempPassword:password,provisioned:true});
    } catch {
      await admin.auth.admin.deleteUser(uid);
      return reply(503,{error:"Student registration did not complete"});
    }
  }
  return reply(400,{error:"Unknown action"});
});