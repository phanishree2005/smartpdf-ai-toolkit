import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Theme store
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'smartpdf-theme' }
  )
)

// Auth store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
    }),
    { name: 'smartpdf-auth' }
  )
)

// File processing store
export const useFileStore = create((set, get) => ({
  files: [],
  processing: false,
  progress: 0,
  result: null,
  error: null,
  addFiles: (newFiles) => set((s) => ({ files: [...s.files, ...newFiles] })),
  removeFile: (index) => set((s) => ({ files: s.files.filter((_, i) => i !== index) })),
  clearFiles: () => set({ files: [], result: null, error: null, progress: 0 }),
  setProcessing: (processing) => set({ processing }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result, processing: false, progress: 100 }),
  setError: (error) => set({ error, processing: false }),
  reorderFiles: (startIndex, endIndex) => {
    const files = [...get().files]
    const [removed] = files.splice(startIndex, 1)
    files.splice(endIndex, 0, removed)
    set({ files })
  },
}))
