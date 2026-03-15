import axios from 'axios'
import { useAuthStore } from '../context/themeStore'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
})

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  loginWithGoogle: (token) => api.post('/auth/google', { token }),
}

// PDF processing endpoints
export const pdfAPI = {
  merge: (files, options) => {
    const form = createFormData(files, options)
    return api.post('/pdf/merge', form, uploadConfig())
  },
  split: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/split', form, uploadConfig())
  },
  compress: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/compress', form, uploadConfig())
  },
  rotate: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/rotate', form, uploadConfig())
  },
  deletePages: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/delete-pages', form, uploadConfig())
  },
  reorderPages: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/reorder', form, uploadConfig())
  },
  extractPages: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/extract', form, uploadConfig())
  },
  addWatermark: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/watermark', form, uploadConfig())
  },
  addPageNumbers: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/page-numbers', form, uploadConfig())
  },
  protect: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/pdf/protect', form, uploadConfig())
  },
}

// Conversion endpoints
export const convertAPI = {
  wordToPdf: (file) => {
    const form = createFormData([file])
    return api.post('/convert/word-to-pdf', form, uploadConfig())
  },
  pdfToWord: (file) => {
    const form = createFormData([file])
    return api.post('/convert/pdf-to-word', form, uploadConfig())
  },
  pptToPdf: (file) => {
    const form = createFormData([file])
    return api.post('/convert/ppt-to-pdf', form, uploadConfig())
  },
  pdfToPpt: (file) => {
    const form = createFormData([file])
    return api.post('/convert/pdf-to-ppt', form, uploadConfig())
  },
  jpgToPdf: (files) => {
    const form = createFormData(files)
    return api.post('/convert/jpg-to-pdf', form, uploadConfig())
  },
  pdfToImages: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/convert/pdf-to-images', form, uploadConfig())
  },
  excelToPdf: (file) => {
    const form = createFormData([file])
    return api.post('/convert/excel-to-pdf', form, uploadConfig())
  },
}

// AI endpoints
export const aiAPI = {
  summarize: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/ai/summarize', form, uploadConfig())
  },
  ask: (file, question, history = []) => {
    const form = createFormData([file], { question, history: JSON.stringify(history) })
    return api.post('/ai/ask', form, uploadConfig())
  },
  extractTables: (file) => {
    const form = createFormData([file])
    return api.post('/ai/extract-tables', form, uploadConfig())
  },
  classify: (file) => {
    const form = createFormData([file])
    return api.post('/ai/classify', form, uploadConfig())
  },
  parseResume: (file) => {
    const form = createFormData([file])
    return api.post('/ai/parse-resume', form, uploadConfig())
  },
  translate: (file, options) => {
    const form = createFormData([file], options)
    return api.post('/ai/translate', form, uploadConfig())
  },
}

// File history
export const historyAPI = {
  getAll: (params) => api.get('/files/history', { params }),
  download: (fileId) => api.get(`/files/download/${fileId}`, { responseType: 'blob' }),
  delete: (fileId) => api.delete(`/files/${fileId}`),
  getStats: () => api.get('/files/stats'),
}

// Helpers
function createFormData(files, options = {}) {
  const form = new FormData()
  if (Array.isArray(files)) {
    files.forEach((f) => form.append('files', f))
  }
  Object.entries(options).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, v)
  })
  return form
}

function uploadConfig(onProgress) {
  return {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  }
}

export default api
