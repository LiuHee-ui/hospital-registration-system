# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow.spec.js >> 全流程 E2E 业务测试 >> 未登录用户自动重定向，登录后可成功加载控制台
- Location: e2e\flow.spec.js:4:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*#\/index/
Received string:  "http://localhost:5173/#/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://localhost:5173/#/login"

```

```yaml
- heading "医院门诊挂号管理系统 - 登录" [level=2]
- text: 用户名：
- textbox: admin
- text: 密码：
- textbox: "123456"
- button "登 录"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('全流程 E2E 业务测试', () => {
  4  |   test('未登录用户自动重定向，登录后可成功加载控制台', async ({ page }) => {
  5  |     // 1. 尝试直接访问首页
  6  |     await page.goto('http://localhost:5173/#/index')
  7  | 
  8  |     // 2. 断言路由被重定向至登录页
  9  |     await expect(page).toHaveURL(/.*#\/login/)
  10 | 
  11 |     // 3. 填写登录表单并提交
  12 |     await page.fill('input[type="text"]', 'admin')
  13 |     await page.fill('input[type="password"]', '123456')
  14 |     await page.click('button[type="submit"]')
  15 | 
  16 |     // 4. 断言成功跳转至首页/控制台
> 17 |     await expect(page).toHaveURL(/.*#\/index/)
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  18 |     await expect(page.locator('h3')).toContainText('今日挂号动态')
  19 |   })
  20 | })
  21 | 
```