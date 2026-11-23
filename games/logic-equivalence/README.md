# Logic Quest — เกมตรวจสอบประพจน์สมมูล (ม.4)

**Standalone URL after GitHub Pages deployment:**
`https://infobwd.github.io/ying-teaching-hub-web/games/logic-equivalence/`

This is a self-contained, public static educational **practice game**. No changes are made to the surrounding Ying Teaching Hub homepage, approved lesson PDFs, or private teaching documents.

## Question sourcing and scoring
- 5 statements are reproduced from the supplied photo of **แบบฝึกหัดที่ 2 ตรวจสอบและแก้ไขการแปลงรูป**. Expected answers: F, T, F, T, T.
- The remaining 10 questions are drawn from 11 distinct identities in the supplied **รูปแบบของประพจน์ที่สมมูลกันที่ควรทราบ** reference, using teacher-authored false variants for 5 of the selected 10. They are not verbatim false variants from the reference.
- Total 15 questions, 8 correct identities and 7 non-equivalent expressions per round. Order and selected variants change between attempts. All displayed equivalence answers are independently computed using exhaustive truth tables for p/q/r.
- 1 point per correct answer, 15 total. No countdown and no attempt limit. Explanations and correct forms appear only after submitting all 15 questions.

## Device registration, privacy and limits
- First play: ID, class, first name and last name are required. The browser locally saves the initial registration under `ying-logic-quest-device-v1` and locks subsequent games on that same origin/browser profile to that student.
- Saves attempt counter, last 40 result summaries, and in-progress state locally. Attempt count is unlimited, but older summaries are trimmed to prevent storage exhaustion.
- This is **not a verified identity or anti-cheat mechanism**: students can switch devices/browser profiles/private mode, erase storage, or inspect local source code. There is no hidden teacher password, server-side authentication, identity verification, signed score receipt or centralized score register.
- All students' data stay in the player's browser unless the student explicitly clicks share/copy/download or takes a screenshot. This game makes **no external API calls**. On shared devices, registration cannot be changed in the UI; teachers must plan a separate device/profile arrangement.
- Teacher needs to manually collect the result screenshot or share text. Do **not** treat screenshots or displayed receipt codes as tamper-proof evidence.

## Run and test
```sh
python3 -m http.server 8000
# http://localhost:8000/games/logic-equivalence/
node --test tests/logic.test.mjs
node --test tests/logic-security.test.mjs
```

## Deployment
This folder is intentionally independent. The public repository's existing Pages root hosting will serve it at `/games/logic-equivalence/` after merging to `main` **only if GitHub Pages is active**. No separate credential or build pipeline is needed.

Before distributing to students: verify URL returns HTTP 200 in an incognito browser, complete 15-question mobile run, test iPhone share/download, and confirm that teachers accept manually submitted score reports.
