import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // https://gemini-test.easyspub.co.kr — 커스텀 도메인이라 사이트가 **루트**에 놓인다.
  // 저장소 이름이 경로에 들어가던 시절('/gemini-test/')의 값을 그대로 두면
  // 번들과 그림을 /gemini-test/... 에서 찾다가 전부 404 가 나고 화면이 비어 버린다.
  // 옛 주소(giyenim.github.io/gemini-test/)는 GitHub 이 이 도메인으로 301 을 보낸다.
  base: '/',
  plugins: [react(), tailwindcss()],
})
