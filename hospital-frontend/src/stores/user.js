import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin } from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('hms_user') || 'null'))
  const token = ref(localStorage.getItem('hms_token') || '')

  async function login(account, password) {
    const data = await apiLogin(account, password)
    if (data.ok) {
      user.value = { account: data.account, perm_type: data.perm_type }
      token.value = data.account // 简单 token 替代方案
      localStorage.setItem('hms_user', JSON.stringify(user.value))
      localStorage.setItem('hms_token', token.value)
    }
    return data
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('hms_user')
    localStorage.removeItem('hms_token')
  }

  function isLoggedIn() {
    return !!user.value
  }

  return { user, token, login, logout, isLoggedIn }
})
