import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// export default defineConfig({
//     base: '/CDXSS/',
//     plugins: [react()]
// })
export default defineConfig({
    plugins: [react()],
    base: './'
});
