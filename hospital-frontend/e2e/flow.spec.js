import { test, expect } from '@playwright/test'

test.describe('全流程 E2E 业务测试', () => {
  test('未登录用户自动重定向，登录后可成功加载控制台', async ({ page }) => {
    // 1. 尝试直接访问首页
    await page.goto('http://localhost:5173/#/index')

    // 2. 断言路由被重定向至登录页
    await expect(page).toHaveURL(/.*#\/login/)

    // 3. 填写登录表单并提交
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')

    // 4. 断言成功跳转至首页/控制台
    await expect(page).toHaveURL(/.*#\/index/)
    await expect(page.locator('h3')).toContainText('今日挂号动态')
  })
})
