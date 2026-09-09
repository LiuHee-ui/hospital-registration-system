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

export default router
