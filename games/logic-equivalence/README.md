# Logic Quest — เกมตรวจสอบประพจน์สมมูล (ม.4)

**Standalone URL after GitHub Pages deployment:**
`https://infobwd.github.io/ying-teaching-hub-web/games/logic-equivalence/`

This is a self-contained, public static educational **practice game**. No changes are made to the surrounding Ying Teaching Hub homepage, approved lesson PDFs, or private teaching documents.

## Question sourcing and scoring — source-only v2
- Uses **all 15 original equivalence pairs from the single screenshot “รูปแบบของประพจน์ที่สมมูลกันที่ควรทราบ”** (printed 1–13, handwritten 14–15), and no question from the other worksheet.
- The image consists entirely of valid equivalences. To prevent scoring 15/15 merely by selecting “true” each time, the game now asks students to choose one equivalent expression from four options. All RHS options are taken from expressions that appear on the same screenshot; distractors are checked as NOT equivalent to the given LHS using exhaustive truth tables.
- Shuffles question order and options each attempt. One point per correct answer, 15 points total. No time limit; play unlimited times.
- The source text itself is not rewritten. Questions 9 and 10 share the same LHS (p → q), and 4 and 11 share p ↔ q, as shown in the reference. Game has exactly one valid answer per round question.
- The content revision has new `SERIES_ID` `ying-equivalence-2569-photo-only-v2` so earlier truth/false results are not used as the new game's best-score/history. Original browser identity remains stored in the same key; unfinished older-version rounds restart automatically.

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
