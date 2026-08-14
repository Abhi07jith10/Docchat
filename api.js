import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Automatically attach the auth token to every request, if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

export const registerUser = (username, email, password) =>
  api.post('/accounts/register/', { username, email, password })

export const loginUser = (username, password) =>
  api.post('/accounts/login/', { username, password })

export const logoutUser = () => api.post('/accounts/logout/')

export const uploadDocument = (file, title) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)
  return api.post('/documents/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const listDocuments = () => api.get('/documents/list/')

export const getSuggestedQuestions = (documentId) =>
  api.get(`/documents/${documentId}/suggestions/`)

export const sendQuery = (documentId, question, sessionId = null) =>
  api.post('/chats/query/', {
    document_id: documentId,
    question,
    session_id: sessionId,
  })

export const renameChat = (sessionId, title) =>
  api.patch(`/chats/${sessionId}/rename/`, { title })

export const renameDocument = (documentId, title) =>
  api.patch(`/documents/${documentId}/rename/`, { title })

export const listChats = () => api.get('/chats/list/')

export const getChatDetail = (sessionId) => api.get(`/chats/${sessionId}/`)

export default api