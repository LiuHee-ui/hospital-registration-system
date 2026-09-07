<template>
  <div class="login-page">
    <div class="login-card">
      <h2>医院挂号管理系统</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>账号</label>
          <input v-model="account" type="text" placeholder="请输入账号" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" required />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const account = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await userStore.login(account.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1976d2, #42a5f5);
}
.login-card {
  background: #fff; padding: 40px; border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: 360px;
}
.login-card h2 { text-align: center; color: #1976d2; margin-bottom: 24px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; color: #333; font-weight: 500; }
.form-group input {
  width: 100%; padding: 10px 12px; border: 1px solid #ddd;
  border-radius: 4px; box-sizing: border-box; font-size: 14px;
}
.form-group input:focus { border-color: #1976d2; outline: none; }
.error-msg { color: #f44336; margin-bottom: 12px; font-size: 14px; text-align: center; }
.btn-primary {
  width: 100%; padding: 12px; background: #1976d2; color: #fff;
  border: none; border-radius: 4px; font-size: 16px; cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: #1565c0; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
