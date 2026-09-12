import { defineStore } from 'pinia'
import { ref } from 'vue'
import { asyncRoutes } from '../router/index'

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref([])

  // 根据角色过滤动态路由，返回拍平的子路由数组
  function generateRoutes(role) {
    const layoutRoute = asyncRoutes.find(r => r.path === '/')
    if (!layoutRoute || !layoutRoute.children) {
      routes.value = []
      return []
    }

    const accessedRoutes = layoutRoute.children.filter(child => {
      if (!child.meta?.roles) return true
      return child.meta.roles.includes(role)
    })

    routes.value = accessedRoutes
    return accessedRoutes
  }

  function resetRoutes() {
    routes.value = []
  }

  return { routes, generateRoutes, resetRoutes }
})
