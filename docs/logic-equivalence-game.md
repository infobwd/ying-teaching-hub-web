# Logic Quest — Teacher launch / QA plan (23 November 2026)

## Goal and v2 source boundary (23 November 2026)
Use **only** the supplied page “รูปแบบของประพจน์ที่สมมูลกันที่ควรทราบ” containing 15 original equivalent forms. No old worksheet 2 questions are included.

## Student flow
1. Open standalone game at `/games/logic-equivalence/`.
2. Register student ID, room, given/family names; browser identity remains locked on this origin.
3. One original LHS expression from the page is displayed, with four RHS options drawn exclusively from the same page. Choose the truly equivalent formula; 15 items each round, in shuffled order.
4. After submitting all 15, receive score and percentage, highest score for v2, attempt number, date, receipt and browser-code; share or save PNG screenshot for teacher.
5. Unlimited retries, 40 most recent local records, and on-device progress persistence; old v1 results stay stored but are not counted in v2 best score.

## Logic QA
- All 15 published source equivalences are mathematically valid and source-faithful.
- Every generated incorrect option is a RHS expression found elsewhere on the same page, with truth tables confirming it is not equivalent to that question's LHS.
- A mixed original worksheet+summary 15-item true/false generator existed in v1; the v2 bank replaces it entirely, with a new series ID.
- All game inputs/answers stay in localStorage and are not sent to the teacher automatically.

## Privacy and anti-impersonation boundary
- Student identity and results are stored **only in localStorage of the student's browser**, not uploaded to GitHub or teacher storage.
- The first ID registered is locked in the game UI to deter casual switching on the same browser. This cannot verify the person holding the device and can be circumvented by deleting data, changing browsers/devices or modifying source. Do not claim complete prevention.
- A displayed receipt code is locally generated and not server-signed; teacher manual review remains required.
- HTTPS static Pages is public; no scores/names are committed to the public repository. Security policy explicitly prevents network connections by game JavaScript.

## Teacher acceptance checklist
- [ ] Repository Pages is enabled and URL actually loads in anonymous browser
- [ ] Confirm real student/class identification fields and student information notice
- [ ] Check 15 questions and formulas on physical iPhone, Android and desktop
- [ ] Check no sideways overflow and Thai readability
- [ ] Check new players are locked after their first registration on same browser
- [ ] Check native sharing to LINE and screenshot/PNG downloading
- [ ] Agree on the means to accept/share student result images and record marks manually
- [ ] Later, if central score collection becomes necessary, design authenticated backend and consent/retention policy first; never put secrets in GitHub Pages JavaScript

## GitHub scope
Public: `infobwd/ying-teaching-hub-web/games/logic-equivalence/`.
Private design source: `infobwd/ying-teaching-hub` is not modified by this release.
Other projects: `infobwd/infobwd-school-creative-studio` remains untouched.
