import axios from 'axios'
import { ElMessage } from 'element-plus'

// 用于存储每个 Pending 请求的 AbortController
const pendingMap = new Map()

const getRequestKey = (config) => {
  return [config.method, config.url, JSON.stringify(config.params), JSON.stringify(config.data)].join('&')
}

const removePending = (config) => {
  const key = getRequestKey(config)
  if (pendingMap.has(key)) {
    const controller = pendingMap.get(key)
    controller.abort()
    pendingMap.delete(key)
  }
}

const request = axios.create({
  baseURL: '',
  timeout: 5000
})

request.interceptors.request.use(
  config => {
    removePending(config)
    const controller = new AbortController()
    config.signal = controller.signal
    pendingMap.set(getRequestKey(config), controller)

    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    removePending(response.config)
    return response.data
  },
  error => {
    if (axios.isCancel(error)) {
      console.log('重复请求已被安全取消:', error.message)
      return Promise.reject(error)
    }
    if (error.config) removePending(error.config)
    const msg = error.response?.data?.error || '网络请求异常'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default request
