# Resume notes (paused mid-task)

## Done
- Vite + React exam UI in `exam-app/`
- 수능형 layout: PDF size 842×1191, center gutter, page flip nav
- Sample data: Q1–3 only (`exam-app/src/data/exam-sample.json`)
- 한 문제씩 mode exists; grading UI temporarily removed

## Next
- Expand to pages 1–12 / questions 1–34 from `레퍼런스/국어영역_문제지.pdf`
- Multi-page column layout matching PDF page breaks
- Re-add 채점하기 / 답안 현황 at the end afterward

## Run
```bash
cd exam-app
npm install
npm run dev
```
