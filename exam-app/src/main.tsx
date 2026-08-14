import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Workbench } from './ui/Workbench.tsx'

/**
 * 주소에 `?ui` 를 붙이면 앱 대신 UI 킷이 열린다 (`src/ui/README.md`).
 * 예: http://localhost:5173/gemini-test/?ui
 *
 * App 안에서 갈라 내지 않고 여기서 가른다 — App 은 훅을 여럿 들고 있어
 * 위쪽에서 먼저 돌려보내면 훅 규칙이 깨진다.
 */
const isWorkbench = new URLSearchParams(window.location.search).has('ui')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isWorkbench ? <Workbench /> : <App />}</StrictMode>,
)
