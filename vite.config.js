import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/pdfjs-dist/cmaps/**/*',
          dest: 'cmaps',
          rename: (name) => name.replace('node_modules/pdfjs-dist/', ''),
          filter: (src) => {
            // 过滤非必要文件
            return src.includes('cmaps') && !src.includes('test');
          },
          copyAll: true 
        }
        
      ]
    })
  ],
  
  // 核心改动：base路径强制指定为根目录（兼容无域名部署）
  base: '/',  // 确保不以斜杠结尾[1](@ref)

  build: {
    outDir: 'dist',
    assetsDir: 'static',
    minify: 'terser',
    sourcemap: false,
    // 新增：解决Chunk文件路径错误
    rollupOptions: {
      output: {
        entryFileNames: 'static/[name]-[hash].js',
        chunkFileNames: 'static/[name]-[hash].js',
        assetFileNames: 'static/[name]-[hash][extname]'
      }
    }
  },
  server: {
    proxy: {
      // 媒体路径代理规则
     '/media': {
       target: 'http://8.134.250.169',  // 指向Nginx服务器
       changeOrigin: true,
       // 保持路径不变，直接转发到Nginx
       rewrite: (path) => path.replace(/^\/media/, '/media'),
      
      headers: {
        Origin: 'http://localhost:5173',
        Referer: 'http://localhost:5173'
      }
    },
      '/api': {
        target: 'http://8.134.250.169:8000', // 实际后端地址
        changeOrigin: true,
        // rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
  
})