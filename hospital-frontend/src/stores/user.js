import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  // 获取当前用户角色（统一使用 role 字段）
  const role = ref(userInfo.value.role || userInfo.value.perm_type || '')

  function setLoginState(newToken, user) {
    token.value = newToken
    userInfo.value = user
    role.value = user.role || user.perm_type || ''
    localStorage.setItem('token', newToken)
    localStorage.setItem('userInfo', JSON.stringify(user))
  }

  function logout() {
    token.value = ''
    userInfo.value = {}
    role.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return { token, userInfo, role, setLoginState, logout }
})
