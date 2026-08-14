import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listChats, listDocuments, logoutUser, renameChat, renameDocument } from '../api'
import DocumentUpload from '../components/DocumentUpload'
import ChatWindow from '../components/ChatWindow'
import PDFViewer from '../components/PDFViewer'
import { useTheme } from '../useTheme'

function ChatApp() {
  const [chats, setChats] = useState([])
  const [documents, setDocuments] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [activeDocument, setActiveDocument] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedFolders, setExpandedFolders] = useState({})
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDocId, setEditingDocId] = useState(null)
  const [editingDocTitle, setEditingDocTitle] = useState('')
  const [isDark, setIsDark] = useTheme()
  const navigate = useNavigate()
  const username = localStorage.getItem('username')

  useEffect(() => {
    fetchChats()
    fetchDocuments()
  }, [])

  const fetchChats = async () => {
    try {
      const response = await listChats()
      setChats(response.data)
    } catch (err) {
      console.error('Failed to load chats', err)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await listDocuments()
      setDocuments(response.data)
      if (response.data.length > 0 && !activeDocument) {
        setActiveDocument(response.data[0])
      }
    } catch (err) {
      console.error('Failed to load documents', err)
    }
  }

  const handleNewChat = () => {
    setActiveChatId(null)
  }

  const handleSelectChat = (chat) => {
    setActiveChatId(chat.id)
    const doc = documents.find((d) => d.id === chat.document)
    if (doc) setActiveDocument(doc)
  }

  const handleUploadSuccess = (document) => {
    setDocuments((prev) => [document, ...prev])
    setActiveDocument(document)
    setActiveChatId(null)
    setCurrentPage(1)
    setExpandedFolders((prev) => ({ ...prev, [document.id]: true }))
  }

  const handleNewSession = (sessionId) => {
    setActiveChatId(sessionId)
    fetchChats()
  }

  const handleSourcePageChange = (page) => {
    setCurrentPage(page)
    const el = document.getElementById(`pdf-page-${page}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleFolder = (docId) => {
    setExpandedFolders((prev) => ({ ...prev, [docId]: !prev[docId] }))
  }

  const startRename = (e, chat) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditingTitle(chat.title)
  }

  const saveRename = async (e, chatId) => {
    e.stopPropagation()
    const trimmed = editingTitle.trim()
    if (!trimmed) {
      setEditingChatId(null)
      return
    }
    try {
      await renameChat(chatId, trimmed)
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: trimmed } : c)))
    } catch (err) {
      console.error('Failed to rename chat', err)
    }
    setEditingChatId(null)
  }

  const startDocRename = (e, doc) => {
    e.stopPropagation()
    setEditingDocId(doc.id)
    setEditingDocTitle(doc.title)
  }

  const saveDocRename = async (e, docId) => {
    e.stopPropagation()
    const trimmed = editingDocTitle.trim()
    if (!trimmed) {
      setEditingDocId(null)
      return
    }
    try {
      await renameDocument(docId, trimmed)
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, title: trimmed } : d)))
      if (activeDocument?.id === docId) {
        setActiveDocument((prev) => ({ ...prev, title: trimmed }))
      }
    } catch (err) {
      console.error('Failed to rename document', err)
    }
    setEditingDocId(null)
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  // Group chats by document
  const chatsByDocument = documents.map((doc) => ({
    document: doc,
    chats: chats.filter((c) => c.document === doc.id),
  }))

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 active:scale-95 shadow-sm hover:shadow-md"
          >
            + New Chat
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {documents.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 px-2">No documents yet</p>
          )}

          {chatsByDocument.map(({ document: doc, chats: docChats }) => (
            <div key={doc.id} className="mb-2">
              {/* Folder header */}
              <div
                onClick={() => toggleFolder(doc.id)}
                className="group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <span className={`text-xs transition-transform ${expandedFolders[doc.id] ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                {editingDocId === doc.id ? (
                  <input
                    autoFocus
                    value={editingDocTitle}
                    onChange={(e) => setEditingDocTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.key === 'Enter' && saveDocRename(e, doc.id)}
                    onBlur={(e) => saveDocRename(e, doc.id)}
                    className="flex-1 text-sm border border-blue-300 dark:border-blue-500 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <>
                    <span className="truncate flex-1">{doc.title}</span>
                    <button
                      onClick={(e) => startDocRename(e, doc)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Rename"
                    >
                      ✎
                    </button>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{docChats.length}</span>
                  </>
                )}
              </div>

              {/* Chats inside the folder */}
              {expandedFolders[doc.id] && (
                <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
                  {docChats.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">No chats yet</p>
                  )}
                  {docChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={`group flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm mb-1 ${
                        activeChatId === chat.id
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {editingChatId === chat.id ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(e, chat.id)}
                          onBlur={(e) => saveRename(e, chat.id)}
                          className="flex-1 text-sm border border-blue-300 dark:border-blue-500 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      ) : (
                        <>
                          <span className="truncate flex-1">{chat.title}</span>
                          <button
                            onClick={(e) => startRename(e, chat)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 ml-1"
                            title="Rename"
                          >
                            ✎
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-sm">
              {username?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{username}</span>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      {!activeDocument ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      ) : (
        <>
          {/* Chat panel */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{activeDocument.title}</span>
              <button
                onClick={() => setActiveDocument(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Upload another document
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                document={activeDocument}
                sessionId={activeChatId}
                onNewSession={handleNewSession}
                onSourcePageChange={handleSourcePageChange}
              />
            </div>
          </div>

          {/* PDF viewer panel */}
          <div className="w-[420px] border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">Viewing: page {currentPage}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer fileUrl={activeDocument.file} currentPage={currentPage} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatApp