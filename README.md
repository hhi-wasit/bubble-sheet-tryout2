# ExamFlow (lean core)
Offline-first OMR grading PWA. Static files only.

## Deploy on GitHub Pages
1. Extract the ZIP. 2. Create a new GitHub repository. 3. Upload the **contents** of the `examflow` folder (index.html at repo root). 4. Settings → Pages → Deploy from branch → `main` / root. 5. Open `https://<user>.github.io/<repo>/` on your Android phone in Chrome. 6. Menu ⋮ → Install app. After the first load it works offline.

## Use
1. Students: add or import `id,name,class` (IDs are 1–8 digits). 2. Exams: set questions, options, marks, penalty, key. 3. Tap **Sheet PDF**, print on A4 at 100% scale (no "fit to page"). 4. Scan: photograph each sheet upright, whole page visible, four black corner squares clear, even light. 5. Review flagged marks, then save. 6. Results: statistics, item analysis, Excel export. 7. Backup: export JSON regularly; restore from the same page.

## Tests
`node tests/tests.js` (grading, item statistics, KR-20, homography).
