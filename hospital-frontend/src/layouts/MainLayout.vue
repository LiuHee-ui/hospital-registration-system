<template>
  <div class="app">
    <header class="nav">
      <div class="nav-inner">
        <h1 class="logo">医院挂号管理系统</h1>
        <nav>
          <router-link to="/">首页</router-link>
          <router-link to="/departments">科室管理</router-link>
          <router-link to="/doctors">医生管理</router-link>
          <router-link to="/patients">患者管理</router-link>
          <router-link to="/schedules">排班管理</router-link>
          <router-link to="/registration">门诊挂号</router-link>
          <router-link to="/statistics">数据统计</router-link>
        </nav>
        <div class="user-info" v-if="user">
          <span>{{ user.account }}（{{ user.perm_type }}）</span>
          <button @click="handleLogout" class="btn-logout">退出</button>
        </div>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.nav {
  background: #1976d2; color: #fff; padding: 0 20px;
}
.nav-inner {
  max-width: 1200px; margin: 0 auto; display: flex;
  align-items: center; gap: 24px; height: 60px;
}
.logo { font-size: 18px; font-weight: bold; margin: 0; }
.nav nav { display: flex; gap: 16px; flex: 1; }
.nav nav a {
  color: rgba(255,255,255,0.85); text-decoration: none;
  padding: 4px 8px; border-radius: 4px; font-size: 14px;
}
.nav nav a:hover,
.nav nav a.router-link-active { color: #fff; background: rgba(255,255,255,0.15); }
.user-info { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.btn-logout {
  background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
  color: #fff; padding: 4px 12px; border-radius: 4px; cursor: pointer;
}
.btn-logout:hover { background: rgba(255,255,255,0.3); }
.main-content { flex: 1; padding: 24px; background: #f5f5f5; }
</style>
