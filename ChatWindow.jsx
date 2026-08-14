import { useState, useEffect, useRef } from 'react'
import { sendQuery, getSuggestedQuestions, getChatDetail } from '../api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Custom renderers so every AI message looks consistent and polished
const markdownComponents = {
  h1: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-3 mb-2 text-gray-900 dark:text-gray-100" {...props} />,
  h2: ({ node, ...props }) => <h3 className="text-base font-semibold mt-3 mb-2 text-gray-900 dark:text-gray-100" {...props} />,
  h3: ({ node, ...props }) => <h4 className="text-sm font-semibold mt-2 mb-1 text-gray-900 dark:text-gray-100" {...props} />,
  p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-blue-300 dark:border-blue-500 pl-3 italic text-gray-600 dark:text-gray-400 my-2" {...props} />
  ),
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code className="bg-gray-100 dark:bg-gray-700 text-pink-600 dark:text-pink-400 px-1 py-0.5 rounded text-xs" {...props} />
    ) : (
      <code className="block bg-gray-900 dark:bg-black text-gray-100 p-3 rounded text-xs overflow-x-auto my-2" {...props} />
    ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full border border-gray-200 dark:border-gray-600 text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-gray-50 dark:bg-gray-700" {...props} />,
  th: ({ node, ...props }) => (
    <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100" {...props} />
  ),
  td: ({ node, ...props }) => <td className="border border-gray-200 dark:border-gray-600 px-3 py-2" {...props} />,
}

function ChatWindow({ document, sessionId, onNewSession, onSourcePageChange }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (sessionId) {
      loadChatHistory()
    } else {
      setMessages([])
    }
    if (document) {
      loadSuggestions()
    }
  }, [sessionId, document])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChatHistory = async () => {
    try {
      const response = await getChatDetail(sessionId)
      setMessages(response.data.messages)
    } catch (err) {
      console.error('Failed to load chat history', err)
    }
  }

  const loadSuggestions = async () => {
    try {
      const response = await getSuggestedQuestions(document.id)
      setSuggestions(response.data)
    } catch (err) {
      console.error('Failed to load suggestions', err)
    }
  }

  const handleSend = async (questionText) => {
    const question = questionText || input
    if (!question.trim() || sending) return

    setInput('')
    setSending(true)

    // Optimistically add the user's message
    setMessages((prev) => [...prev, { role: 'user', content: question }])

    try {
      const response = await sendQuery(document.id, question, sessionId)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.answer, source_page: response.data.source_page },
      ])
      if (onSourcePageChange) {
        onSourcePageChange(response.data.source_page)
      }
      if (!sessionId) {
        onNewSession(response.data.session_id)
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't generate a response right now. Please try again." },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex animate-[fadeIn_0.3s_ease] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
              {msg.source_page && (
                <button
                  onClick={() => onSourcePageChange && onSourcePageChange(msg.source_page)}
                  className="text-xs text-blue-500 dark:text-blue-400 hover:underline mt-1 block"
                >
                  Source: page {msg.source_page}
                </button>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-lg flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && messages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSend(s.question_text)}
              className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 px-3 py-1.5 rounded-full text-gray-700 dark:text-gray-200 shadow-sm"
            >
              {s.question_text}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about your document..."
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          disabled={sending}
        />
        <button
          onClick={() => handleSend()}
          disabled={sending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:scale-95 disabled:opacity-50 shadow-sm"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatWindow