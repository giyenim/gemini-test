import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GradingScreen } from './components/result/GradingOverlay.tsx'
import { ResultPreview } from './components/result/ResultPreview.tsx'
import { Workbench } from './ui/Workbench.tsx'

/**
 * 개발용 옆문 셋. 주소에 붙이면 앱 대신 그 화면만 열린다.
 *
 *   ?ui       UI 킷 작업장 (`src/ui/README.md`)
 *   ?bar      채점 중 화면을 **멈춰 세운 것** — 띠가 반쯤 찬 채로 선다.
 *             `?bar=80` 처럼 0~100 을 주면 그만큼 찬 자리에서 멈춘다.
 *             그리는 것은 실제 `GradingScreen` 그대로다.
 *   ?result   성적표 화면 — 표지·시험지·채점을 건너뛴다 (`ResultPreview` 주석 참고)
 *
 * 예: http://localhost:5173/?result=17
 *
 * App 안에서 갈라 내지 않고 여기서 가른다 — App 은 훅을 여럿 들고 있어
 * 위쪽에서 먼저 돌려보내면 훅 규칙이 깨진다.
 */
const params = new URLSearchParams(window.location.search)
const result = params.get('result')
const bar = params.get('bar')

/* 컴포넌트로 두지 않고 그때그때 고른다 — 이 파일은 아무것도 내보내지 않아서
   컴포넌트를 두면 Fast Refresh 가 걸리지 않는다 */
function pickEntry() {
  if (params.has('ui')) return <Workbench />
  /* 빈 값(`?bar`)이면 절반 — 찬 쪽과 빈 쪽, 양쪽 캡이 한눈에 들어오는 자리다 */
  if (bar !== null) {
    const percent = bar === '' ? 50 : Number(bar)
    const clamped = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 50))
    return <GradingScreen progress={clamped / 100} />
  }
  if (result !== null) return <ResultPreview value={result} />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{pickEntry()}</StrictMode>,
)
