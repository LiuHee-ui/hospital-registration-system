import { createRouter, createWebHashHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: 'index', name: 'Home', component: () => import('../views/HomeView.vue') },
      { path: 'departments', name: 'Departments', component: () => import('../views/DepartmentsView.vue') },
      { path: 'doctors', name: 'Doctors', component: () => import('../views/DoctorsView.vue') },
      { path: 'patients', name: 'Patients', component: () => import('../views/PatientsView.vue') },
      { path: 'registration', name: 'Registration', component: () => import('../views/RegistrationView.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局路由鉴权守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isLoginPage = to.path === '/login'

  if (!isLoginPage && !token) {
    // 未登录访问受保护页面：强制跳转至登录页
    alert('请先登录系统！')
    next('/login')
  } else if (isLoginPage && token) {
    // 已登录状态访问登录页：直接跳转至控制台
    next('/index')
  } else {
    next()
  }
})

export default router
