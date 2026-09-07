import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Home', component: () => import('@/views/HomeView.vue') },
      { path: 'departments', name: 'Departments', component: () => import('@/views/DepartmentsView.vue') },
      { path: 'doctors', name: 'Doctors', component: () => import('@/views/DoctorsView.vue') },
      { path: 'patients', name: 'Patients', component: () => import('@/views/PatientsView.vue') },
      { path: 'schedules', name: 'Schedules', component: () => import('@/views/SchedulesView.vue') },
      { path: 'registration', name: 'Registration', component: () => import('@/views/RegistrationView.vue') },
      { path: 'statistics', name: 'Statistics', component: () => import('@/views/StatisticsView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('hms_user') || 'null')
  if (to.meta.requiresAuth !== false && !user) {
    next('/login')
  } else if (to.path === '/login' && user) {
    next('/')
  } else {
    next()
  }
})

export default router
