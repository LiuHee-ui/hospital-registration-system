import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './assets/style.css'

const app = createApp(App)

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局异常处理器
app.config.errorHandler = (err, instance, info) => {
  console.error('[Global Error Handler]:', { err, info })
  if (import.meta.env.PROD) {
    // navigator.sendBeacon('/api/logs/error', JSON.stringify({ message: err.message, stack: err.stack, info }))
  }
}

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.warn('[Unhandled Rejection]:', event.reason)
})

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
