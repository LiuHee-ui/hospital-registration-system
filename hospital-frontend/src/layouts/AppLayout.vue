<template>
  <div class="app-layout" style="display: flex; min-height: 100vh;">
    <aside style="width: 220px; background: #2c3e50; color: #fff; padding: 20px 10px;">
      <h3 style="color: #fff; text-align: center; margin-bottom: 30px;">门诊管理系统</h3>
      <nav style="display: flex; flex-direction: column; gap: 10px;">
        <router-link
          v-for="menu in permissionStore.routes"
          :key="menu.path"
          :to="'/' + menu.path"
          class="nav-item"
        >
          {{ menu.meta?.title }}
        </router-link>
      </nav>
    </aside>
    <main style="flex: 1; background: var(--el-bg-color); display: flex; flex-direction: column;">
      <header style="background: var(--el-bg-color-page); padding: 15px 30px; border-bottom: 1px solid var(--el-border-color); display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <el-switch
            v-model="isDark"
            inline-prompt
            active-icon="Moon"
            inactive-icon="Sunny"
            @change="toggleDark"
          />
          <span>当前操作员：<strong>{{ userStore.userInfo.username || '管理员' }}</strong>
            <el-tag size="small" style="margin-left: 8px;">{{ roleLabel }}</el-tag>
          </span>
        </div>
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
import { usePermissionStore } from '../stores/permission'
import { useDark, useToggle } from '@vueuse/core'
import { resetRouter } from '../router/index'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const isDark = useDark()
const toggleDark = useToggle(isDark)

const roleLabel = computed(() => {
  const map = { ADMIN: '系统管理员', DOCTOR: '门诊医生', RECEPTIONIST: '挂号前台' }
  return map[userStore.role] || userStore.role || '未知'
})

const handleLogout = () => {
  resetRouter()
  permissionStore.resetRoutes()
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
