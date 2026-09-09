import axios from 'axios'

const request = axios.create({
  baseURL: '',
  timeout: 5000
})

// 请求拦截器：携带登录 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：统一提取返回数据与错误提示
request.interceptors.response.use(
  response => response.data,
  error => {
    const msg = error.response?.data?.message || '网络请求异常'
    alert(msg)
    return Promise.reject(error)
  }
)

export default request
