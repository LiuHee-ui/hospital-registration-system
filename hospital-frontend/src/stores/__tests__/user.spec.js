import { setActivePinia, createPinia } from 'pinia'
import { describe, beforeEach, it, expect } from 'vitest'
import { useUserStore } from '../user'

describe('User Store 单元测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('初始状态下 Token 应为空', () => {
    const userStore = useUserStore()
    expect(userStore.token).toBe('')
  })

  it('正确保存登录状态并同步至 localStorage', () => {
    const userStore = useUserStore()
    const testToken = 'mock-jwt-token-12345'
    const testUser = { username: 'admin' }

    userStore.setLoginState(testToken, testUser)

    expect(userStore.token).toBe(testToken)
    expect(localStorage.getItem('token')).toBe(testToken)
  })

  it('退出登录时应正确清理状态', () => {
    const userStore = useUserStore()
    userStore.setLoginState('mock-token', { username: 'admin' })
    userStore.logout()

    expect(userStore.token).toBe('')
    expect(localStorage.getItem('token')).toBeNull()
  })
})
