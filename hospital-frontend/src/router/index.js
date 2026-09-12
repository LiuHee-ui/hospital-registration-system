import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'

// 1. 公开常驻路由
export const constantRoutes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
  { path: '/queue-display', name: 'QueueDisplay', component: () => import('../views/QueueDisplayView.vue') }
]

// 2. 需权限校验的动态路由
export const asyncRoutes = [
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      {
        path: 'index',
        name: 'Home',
        component: () => import('../views/HomeView.vue'),
        meta: { title: '控制台首页', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] }
      },
      {
        path: 'departments',
        name: 'Departments',
        component: () => import('../views/DepartmentsView.vue'),
        meta: { title: '科室管理', roles: ['ADMIN'] }
      },
      {
        path: 'doctors',
        name: 'Doctors',
        component: () => import('../views/DoctorsView.vue'),
        meta: { title: '医生管理', roles: ['ADMIN'] }
      },
      {
        path: 'patients',
        name: 'Patients',
        component: () => import('../views/PatientsView.vue'),
        meta: { title: '患者档案', roles: ['ADMIN', 'RECEPTIONIST'] }
      },
      {
        path: 'registration',
        name: 'Registration',
        component: () => import('../views/RegistrationView.vue'),
        meta: { title: '挂号办理', roles: ['ADMIN', 'RECEPTIONIST'] }
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('../views/SchedulesView.vue'),
        meta: { title: '排班管理', roles: ['ADMIN', 'DOCTOR'] }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/StatisticsView.vue'),
        meta: { title: '数据统计', roles: ['ADMIN'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
})

// 3. 动态路由注入守卫
let isRoutesAdded = false
let addedRole = ''

// 重置路由状态（供登出时调用）
export function resetRouter() {
  isRoutesAdded = false
  addedRole = ''
}

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const token = localStorage.getItem('token')

  if (!token) {
    if (to.path === '/login') return next()
    return next('/login')
  }

  if (to.path === '/login') {
    return next('/index')
  }

  // 角色变更时重新添加路由
  if (!isRoutesAdded || addedRole !== userStore.role) {
    const role = userStore.role || 'ADMIN'
    permissionStore.generateRoutes(role)

    // 获取 layout 路由并注入子路由
    const layoutRoute = asyncRoutes.find(r => r.path === '/')
    if (layoutRoute && layoutRoute.children) {
      layoutRoute.children.forEach(child => {
        router.addRoute('/', child)
      })
    }

    isRoutesAdded = true
    addedRole = role
    return next({ ...to, replace: true })
  }

  next()
})

export default router
