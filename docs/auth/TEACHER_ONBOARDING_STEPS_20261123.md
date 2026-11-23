# ขั้นตอนสร้างบัญชีครูพี่หญิง (บัญชีอีเมลที่ผู้ใช้ยืนยัน)

> เก็บอีเมลจริงในตารางส่วนตัว `yth_internal.teacher_onboarding` เท่านั้น
> ไม่เผยแพร่รหัสผ่านหรือข้อมูลอีเมลส่วนตัวใน GitHub

## ปัจจุบัน
- Supabase: `zutekwbsqdhcnvcppvjx`, สถานะ ACTIVE_HEALTHY
- มี `yth_internal.teacher_onboarding` เพื่อบันทึกเป้าหมายเชิญครูแบบส่วนตัว มี RLS และไม่ได้ให้สิทธิ์ `anon/authenticated`
- สถานะ `invited` หมายถึง **สร้าง Auth user และส่งคำเชิญแล้ว แต่ยังไม่ได้ยืนยันอีเมลหรือให้ teacher role**; บันทึก UUID บัญชีที่ตรวจพบไว้ในทะเบียนส่วนตัว
- ตรวจล่าสุดพบคำเชิญบัญชีครูตามอีเมลที่ยืนยันแล้ว โดย `email_confirmed_at` ยังเป็น NULL; ยังไม่มีสิทธิ์ครู

## สิ่งที่ต้องทำโดยผู้ดูแล
1. เปิด https://supabase.com/dashboard/project/zutekwbsqdhcnvcppvjx/auth/users
2. กด **Invite user**, กรอกอีเมลที่ผู้ใช้ยืนยันในทะเบียน `yth_internal.teacher_onboarding`; ส่งคำเชิญไปยังอีเมลเจ้าของบัญชี (อย่าตั้งหรือส่งรหัสผ่านในแชท)
3. ตั้ง Supabase Authentication > URL Configuration โดยให้ Redirect URLs รวม `https://infobwd.github.io/ying-teaching-hub-web/classroom/setup/` และสำหรับคำเชิญใหม่ให้ใช้ URL นี้เป็น `redirectTo` (หรือ Site URL หากส่งจากหน้า Dashboard ที่เลือก redirectTo ไม่ได้).\n4. ให้เจ้าของบัญชีกดลิงก์คำเชิญจากอีเมลเพื่อตั้งรหัสผ่านผ่าน `/classroom/setup/` โดยตรง หากคำเชิญที่ส่งก่อนแก้ URL พาไปผิดหน้า ให้ส่งคำเชิญใหม่หลังแก้การตั้งค่า
5. ตรวจ `auth.users` ว่ามี email ที่ตรงและ `email_confirmed_at` ไม่เป็น NULL หลังยืนยัน
6. ใน SQL Editor (Admin trusted context) ใช้:
   ```sql
   insert into public.yth_user_roles(user_id,role)
   select id, 'teacher' from auth.users
   where lower(email) = '<approved-email>'
     and email_confirmed_at is not null
   on conflict (user_id) do update set role='teacher';
   ```
   ไม่ให้สิทธิ์ครูแก่บัญชีที่ยังไม่ได้ยืนยันอีเมล
7. เมื่อยืนยันแล้ว เปลี่ยน `yth_internal.teacher_onboarding.state` เป็น `active` และเติม `auth_user_id`/`activated_at` ตาม UUID จริง
8. ให้ครูทดสอบ https://infobwd.github.io/ying-teaching-hub-web/classroom/login/ แล้วเปิด https://infobwd.github.io/ying-teaching-hub-web/classroom/students/

## ทดสอบก่อนนำเข้ารายชื่อนักเรียน
- ครูเข้าได้, บุคคลทั่วไปเข้าไม่ได้, logout ได้, เปลี่ยนรหัสผ่านได้
- ตัวละคร/สถานะหัวห้อง 3D ใช้สถานะเบราว์เซอร์นี้เท่านั้น
- จากนั้นค่อยสร้าง course/class ที่โยง `owner_uid`/`teacher_uid` กับ UUID จริงแล้วนำเข้ารายชื่อที่ตรวจรับแล้ว
- ข้อมูลนักเรียนต้องอยู่ Supabase (RLS) ไม่ใช่ GitHub Pages
