# Logic Quest — Teacher launch / QA plan (23 November 2026)

## Goal
Build a separate mobile-first game for additional mathematics M.4, equivalence of propositions. This is a direct practice exercise from two supplied reference screenshots: exercise 2 (5 statements) and a summary of equivalent forms (15 stated identities). It must not interfere with the Creative Studio congratulatory-card templates or the existing learning hub pages.

## Student flow
1. Open the independent `/games/logic-equivalence/` page.
2. Enter real school student ID, classroom, given name and surname (first use on the browser only).
3. Complete 15 questions: choose **ถูก** or **ผิด**. No correctness feedback until finished.
4. End screen: score /15, percent, best score on the browser, attempt number, date/time, receipt code and short browser-device code.
5. Share results through the phone share sheet, download a PNG score card, or screenshot and send to teacher.
6. Play repeatedly with randomized questions; no attempt limit. Last 40 results and current unfinished attempt persist on the browser; total attempt count persists.

## Accuracy controls
- The five supplied exercise statements are preserved with their original truth status. In particular ~(p ∨ q) ≡ ~p ∨ ~q and p ∧ (q ∨ r) ≡ (p ∧ q) ∨ r are both **false**.
- Variant questions from the equivalence list are distinguished from the original reference by using teacher-authored incorrect variants. Every statement is evaluated across all 8 truth assignments for p/q/r.
- 7 Node tests currently verify the truth table and generator properties; browser smoke tests cover a 15-question run, result page, PNG export, replay and responsive mobile layout in an embedded Chromium test context. These do not replace a real live HTTPS/iPhone QA run.

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
