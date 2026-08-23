import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ResultPreview } from './components/result/ResultPreview.tsx'
import { Workbench } from './ui/Workbench.tsx'

/**
 * 개발용 옆문 둘. 주소에 붙이면 앱 대신 그 화면만 열린다.
 *
 *   ?ui       UI 킷 작업장 (`src/ui/README.md`)
 *   ?result   성적표 화면 — 표지·시험지·채점을 건너뛴다 (`ResultPreview` 주석 참고)
 *
 * 예: http://localhost:5173/?result=17
 *
 * App 안에서 갈라 내지 않고 여기서 가른다 — App 은 훅을 여럿 들고 있어
 * 위쪽에서 먼저 돌려보내면 훅 규칙이 깨진다.
 */
const params = new URLSearchParams(window.location.search)
const result = params.get('result')

/* 컴포넌트로 두지 않고 그때그때 고른다 — 이 파일은 아무것도 내보내지 않아서
   컴포넌트를 두면 Fast Refresh 가 걸리지 않는다 */
function pickEntry() {
  if (params.has('ui')) return <Workbench />
  if (result !== null) return <ResultPreview value={result} />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{pickEntry()}</StrictMode>,
)
