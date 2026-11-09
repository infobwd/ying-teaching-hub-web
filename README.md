# Ying Teaching Hub Web

เว็บไซต์สาธารณะของ **ครูหญิง — นิรมล** สำหรับเผยแพร่สื่อการเรียนรู้ที่ตรวจและอนุมัติแล้ว (Public MVP P1)

> **ไม่ใช่ระบบข้อมูลนักเรียน** — ไม่มีการเข้าสู่ระบบครู ไม่มีทะเบียนนักเรียน ไม่มีคะแนน ไม่มีข้อมูลผู้ปกครอง และไม่มีการเชื่อม Google Sheets/Drive/Firebase จริงในรุ่นนี้

## Repository แยกตามบทบาท
- **Website (Public):** `infobwd/ying-teaching-hub-web` — this repository; GitHub Pages static front end
- **Master plans (Private):** `infobwd/ying-teaching-hub` — source of truth for design, data contracts and roadmap

## มีอะไรใน MVP
- หน้าแรกภาษาไทยสำหรับมือถือและเดสก์ท็อป
- พื้นที่งานสอนประจำ / งานสอนพิเศษ (แสดงเฉพาะข้อมูลทั่วไป)
- คลังสื่อสาธารณะจาก `data/public-materials.json`, ตัวกรอง/ค้นหา/สถานะไม่มีข้อมูล
- โหมดสว่าง/มืด และเมนูสำหรับมือถือ
- หน้าบอกแผนการพัฒนา (ระบบครูส่วนตัวและคะแนน **ยังไม่เปิด**)
- ตรวจสอบไฟล์ JSON แบบ deny-by-default ก่อนเผยแพร่ด้วยสคริปต์ทดสอบ

## เริ่มใช้งานในเครื่อง
ใช้เว็บเซิร์ฟเวอร์แบบ static เพื่อให้ `fetch` JSON ทำงาน:
```bash
python3 -m http.server 8000
# เปิด http://localhost:8000/
```
ตรวจไฟล์ก่อน Merge:
```bash
node --check app.js
node tests/validate-public-catalog.mjs
```

## เปิด GitHub Pages
หลัง Merge ลง `main` ให้เข้า **Settings → Pages → Build and deployment → Deploy from a branch** เลือก `main` และ `/(root)`, Save แล้วรอ GitHub รายงาน URL หน้า Pages จากหน้า Settings/Actions ก่อนถือว่าเปิดใช้งานจริง

URL ที่คาดหมาย (ยังต้องตรวจจริง): `https://infobwd.github.io/ying-teaching-hub-web/`

## การเพิ่มสื่อที่ได้รับอนุมัติ
อ่าน [คู่มือเผยแพร่](docs/PUBLICATION_GUIDE.md) ก่อนแก้ไฟล์ `data/public-materials.json`. **อย่าเพิ่มรายการที่ยังไม่อนุมัติลงใน Public repo แม้จะตั้งค่าให้ JavaScript ซ่อนก็ตาม**

## ปลอดภัยไว้ก่อน
- ไม่มีชื่อ/คะแนนนักเรียน/ข้อมูลส่วนตัว/คีย์ หรือรหัสผ่านใด ๆ ในเว็บไซต์
- หน้าเว็บไม่ใช่ security boundary; ข้อมูลส่วนตัวต้องผ่าน backend + authorization ก่อนอนุญาตให้เข้าถึง
- งานส่วนตัวครูยังใช้แหล่งข้อมูลส่วนตัว (Sheets/Drive) ตามแผนใน Repository หลัก
