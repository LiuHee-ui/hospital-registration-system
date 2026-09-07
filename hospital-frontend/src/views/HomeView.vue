<template>
  <div class="home">
    <div class="welcome-banner">
      <h2>欢迎使用医院门诊挂号管理系统</h2>
      <p>当前登录：{{ user?.account }}（{{ user?.perm_type }}）</p>
    </div>
    <div class="quick-links">
      <router-link to="/registration" class="card card-primary">
        <div class="card-icon">📋</div>
        <h3>门诊挂号</h3>
        <p>为患者办理挂号</p>
      </router-link>
      <router-link to="/patients" class="card card-success">
        <div class="card-icon">👥</div>
        <h3>患者管理</h3>
        <p>患者信息建档</p>
      </router-link>
      <router-link to="/schedules" class="card card-warning">
        <div class="card-icon">📅</div>
        <h3>排班管理</h3>
        <p>管理医生出诊</p>
      </router-link>
      <router-link to="/statistics" class="card card-info">
        <div class="card-icon">📊</div>
        <h3>数据统计</h3>
        <p>查看挂号报表</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const user = computed(() => userStore.user)
</script>

<style scoped>
.home { max-width: 1000px; margin: 0 auto; }
.welcome-banner {
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  color: #fff; padding: 32px; border-radius: 8px; margin-bottom: 24px;
}
.welcome-banner h2 { margin: 0 0 8px; }
.welcome-banner p { margin: 0; opacity: 0.9; }
.quick-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.card {
  background: #fff; padding: 24px; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-decoration: none;
  color: #333; transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover { transform: translateY(-4px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
.card-icon { font-size: 36px; margin-bottom: 12px; }
.card h3 { margin: 0 0 8px; font-size: 18px; }
.card p { margin: 0; color: #666; font-size: 14px; }
.card-primary { border-left: 4px solid #1976d2; }
.card-success { border-left: 4px solid #4caf50; }
.card-warning { border-left: 4px solid #ff9800; }
.card-info { border-left: 4px solid #00bcd4; }
</style>
