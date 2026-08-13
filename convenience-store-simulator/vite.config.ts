import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// export default defineConfig({
//     base: '/CDXSS/',
//     plugins: [react()]
// })

export default defineConfig({
    plugins: [react()],
    base: './' // 静态相对路径，vercel根域名部署用这个；不要写子目录路径
})