<template>
  <div class="login-container" style="max-width: 400px; margin: 100px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
    <h2>医院门诊挂号管理系统 - 登录</h2>
    <form @submit.prevent="handleLogin">
      <div style="margin-bottom: 15px;">
        <label>用户名：</label>
        <input v-model="form.account" type="text" required style="width: 100%; padding: 8px; margin-top: 5px;" />
      </div>
      <div style="margin-bottom: 15px;">
        <label>密码：</label>
        <input v-model="form.password" type="password" required style="width: 100%; padding: 8px; margin-top: 5px;" />
      </div>
      <button type="submit" :disabled="loading" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        {{ loading ? '登录中...' : '登 录' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import request from '../api/request'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({ account: '', password: '' })
const loading = ref(false)

const handleLogin = async () => {
  try {
    loading.value = true
    const res = await request.post('/api/login', form)
    // 保存安全的 token 和用户信息
    userStore.setLoginState(res.token, { username: res.account, role: res.perm_type })
    alert('登录成功！')
    router.push('/index')
  } catch (err) {
    console.error('登录失败：', err)
  } finally {
    loading.value = false
  }
}
</script>
