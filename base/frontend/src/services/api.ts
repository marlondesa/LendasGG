import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
})

api.interceptors.response.use(
  res => res,
  err => {
    const isAuthCheck = err.config?.url?.includes('/api/auth/me')
    if (err.response?.status === 401 && !isAuthCheck) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
