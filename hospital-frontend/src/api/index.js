import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：自动附加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token')
    if (token) {
      config.headers['X-Auth-Token'] = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default api

// 登录
export const login = (account, password) =>
  api.post('/login', { account, password })

// 科室
export const getDepartments = () => api.get('/departments')
export const addDepartment = (data) => api.post('/departments', data)
export const updateDepartment = (dept_id, data) => api.put(`/departments/${dept_id}`, data)
export const deleteDepartment = (dept_id) => api.delete(`/departments/${dept_id}`)

// 医生
export const getDoctors = (dept_id) =>
  dept_id ? api.get(`/doctors?dept_id=${dept_id}`) : api.get('/doctors')
export const addDoctor = (data) => api.post('/doctors', data)
export const updateDoctor = (doctor_id, data) => api.put(`/doctors/${doctor_id}`, data)
export const deleteDoctor = (doctor_id) => api.delete(`/doctors/${doctor_id}`)

// 患者
export const getPatients = () => api.get('/patients')
export const addPatient = (data) => api.post('/patients', data)
export const updatePatient = (patient_id, data) => api.put(`/patients/${patient_id}`, data)
export const deletePatient = (patient_id) => api.delete(`/patients/${patient_id}`)
export const findOrCreatePatient = (data) => api.post('/patients/find-or-create', data)

// 挂号
export const getRegistrations = () => api.get('/registrations')
export const addRegistration = (data) => api.post('/registrations', data)
export const updateRegistrationStatus = (reg_id, visit_status) =>
  api.patch(`/registrations/${reg_id}/status`, { visit_status })
export const deleteRegistration = (reg_id) => api.delete(`/registrations/${reg_id}`)

// 排班
export const getSchedules = (date) =>
  date ? api.get(`/schedules?date=${date}`) : api.get('/schedules')
export const addSchedule = (data) => api.post('/schedules', data)
export const updateSchedule = (sched_id, data) => api.put(`/schedules/${sched_id}`, data)
export const deleteSchedule = (sched_id) => api.delete(`/schedules/${sched_id}`)

// 统计
export const getStatisticsSummary = () => api.get('/statistics/summary')
export const getStatisticsByDept = () => api.get('/statistics/by-dept')

// 智能分诊
export const recommendDept = (description) =>
  api.post('/recommend-dept', { description })
