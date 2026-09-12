<template>
  <div class="app-layout" style="display: flex; min-height: 100vh;">
    <aside style="width: 220px; background: #2c3e50; color: #fff; padding: 20px 10px;">
      <h3 style="color: #fff; text-align: center; margin-bottom: 30px;">门诊管理系统</h3>
      <nav style="display: flex; flex-direction: column; gap: 10px;">
        <router-link
          v-for="menu in menuList"
          :key="menu.path"
          :to="'/' + menu.path"
          class="nav-item"
        >
          {{ menu.meta?.title }}
        </router-link>
      </nav>
    </aside>
    <main style="flex: 1; background: #f8f9fa; display: flex; flex-direction: column;">
      <header style="background: #fff; padding: 15px 30px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <span>当前操作员：<strong>{{ userStore.userInfo.username || '管理员' }}</strong>
          <el-tag size="small" style="margin-left: 8px;">{{ roleLabel }}</el-tag>
        </span>
        <button @click="handleLogout" style="padding: 6px 12px; background: #dc3545; color: #fff; border: none; border-radius: 4px; cursor: pointer;">退出登录</button>
      </header>
      <section style="padding: 24px; flex: 1;">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { asyncRoutes, resetRouter } from '../router/index'

const router = useRouter()
const userStore = useUserStore()

// 角色标签显示
const roleLabel = computed(() => {
  const map = { ADMIN: '系统管理员', DOCTOR: '门诊医生', RECEPTIONIST: '挂号前台' }
  return map[userStore.role] || userStore.role || '未知'
})

// 提取 Layout 子路由中的有效菜单（根据权限过滤）
const menuList = computed(() => {
  const layoutRoute = asyncRoutes.find(r => r.path === '/')
  if (!layoutRoute || !layoutRoute.children) return []

  return layoutRoute.children.filter(child => {
    if (!child.meta?.roles) return true
    return child.meta.roles.includes(userStore.role)
  })
})

// 登出
const handleLogout = () => {
  resetRouter()
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-item {
  color: #ecf0f1;
  text-decoration: none;
  padding: 10px 15px;
  border-radius: 4px;
}
.nav-item.router-link-active {
  background: #3498db;
  color: #fff;
}
</style>
