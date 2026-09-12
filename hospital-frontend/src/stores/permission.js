import { defineStore } from 'pinia'
import { ref } from 'vue'
import { constantRoutes, asyncRoutes } from '../router/index'

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref([])

  // 根据角色过滤动态路由
  function generateRoutes(role) {
    const accessedRoutes = asyncRoutes.filter(route => {
      // 检查子路由的 roles 元信息
      if (!route.children) return true
      return route.children.some(child => {
        if (!child.meta?.roles) return true
        return child.meta.roles.includes(role)
      })
    })
    routes.value = constantRoutes.concat(accessedRoutes)
    return accessedRoutes
  }

  // 重置路由状态（登出时调用）
  function resetRoutes() {
    routes.value = []
  }

  return { routes, generateRoutes, resetRoutes }
})
