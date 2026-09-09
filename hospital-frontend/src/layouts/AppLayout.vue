<template>
  <div class="app-layout" style="display: flex; min-height: 100vh;">
    <aside style="width: 220px; background: #2c3e50; color: #fff; padding: 20px 10px;">
      <h3 style="color: #fff; text-align: center; margin-bottom: 30px;">门诊管理系统</h3>
      <nav style="display: flex; flex-direction: column; gap: 10px;">
        <router-link to="/index" class="nav-item">控制台首页</router-link>
        <router-link to="/departments" class="nav-item">科室管理</router-link>
        <router-link to="/doctors" class="nav-item">医生管理</router-link>
        <router-link to="/patients" class="nav-item">患者档案</router-link>
        <router-link to="/registration" class="nav-item">挂号办理</router-link>
      </nav>
    </aside>
    <main style="flex: 1; background: #f8f9fa; display: flex; flex-direction: column;">
      <header style="background: #fff; padding: 15px 30px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
        <span>当前操作员：<strong>{{ userStore.userInfo.username || '管理员' }}</strong></span>
        <button @click="handleLogout" style="padding: 6px 12px; background: #dc3545; color: #fff; border: none; border-radius: 4px; cursor: pointer;">退出登录</button>
      </header>
      <section style="padding: 24px; flex: 1;">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
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
