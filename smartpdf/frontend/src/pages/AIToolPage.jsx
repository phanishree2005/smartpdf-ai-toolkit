import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Sparkles, Bot, User, Download, Copy, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { getToolById } from '../utils/tools'
import { useFileStore } from '../context/themeStore'
import DropZone from '../components/ui/DropZone'
import { aiAPI } from '../utils/api'

export default function AIToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)
  const { files, setProcessing, setResult, setError } = useFileStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setLocalResult] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!tool) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-6xl mb-4">🤖</p>
        <h2 className="text-2xl font-bold text-slate-200 mb-2">AI Tool not found</h2>
        <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  const isChatTool = tool.id === 'ask-pdf'

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (files.length === 0) { toast.error('Please upload a PDF first.'); return }

    const question = input.trim()
    if (isChatTool && !question) return

    setLoading(true)
    if (isChatTool) {
      setMessages((m) => [...m, { role: 'user', content: question }])
      setInput('')
    }

    try {
      let response

      switch (tool.id) {
        case 'ai-summary':
          response = await aiAPI.summarize(files[0])
          setLocalResult({ type: 'text', content: response.data.summary })
          break
        case 'ask-pdf':
          response = await aiAPI.ask(files[0], question, messages)
          setMessages((m) => [...m, { role: 'assistant', content: response.data.answer }])
          break
        case 'table-extraction':
          response = await aiAPI.extractTables(files[0])
          setLocalResult({ type: 'tables', content: response.data.tables, downloadUrl: response.data.downloadUrl })
          break
        case 'doc-classification':
          response = await aiAPI.classify(files[0])
          setLocalResult({ type: 'classification', content: response.data })
          break
        case 'resume-parsing':
          response = await aiAPI.parseResume(files[0])
          setLocalResult({ type: 'resume', content: response.data })
          break
        case 'translation':
          response = await aiAPI.translate(files[0], {})
          setResult({ downloadUrl: response.data.downloadUrl, filename: response.data.filename })
          break
        default:
          toast.error('Tool not implemented')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'AI processing failed. Please try again.'
      toast.error(msg)
      if (isChatTool) setMessages((m) => [...m, { role: 'error', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          All tools
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative"
          style={{ background: `${tool.color}20`, border: `1px solid ${tool.color}30` }}>
          {tool.icon}
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-violet-500 to-brand-500 rounded-full flex items-center justify-center">
            <Sparkles size={10} className="text-white" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-display font-bold text-slate-100">{tool.name}</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
              AI Powered
            </span>
          </div>
          <p className="text-slate-500 text-sm">{tool.description}</p>
        </div>
      </motion.div>

      {/* Upload */}
      {files.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <DropZone tool={tool} />
        </motion.div>
      )}

      {/* Chat Interface (Ask PDF) */}
      {isChatTool && files.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 glass rounded-xl border border-emerald-500/20">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="text-sm text-slate-400 font-medium">{files[0].name}</span>
            <span className="ml-auto text-xs text-slate-600">Ready to chat</span>
          </div>

          {/* Messages */}
          <div className="glass-card min-h-[400px] max-h-[520px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center border border-brand-500/20">
                  <Bot size={28} className="text-brand-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-300 mb-2">Ask anything about your PDF</h3>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Summarize this document','What are the key findings?','Extract the main points','List all dates mentioned'].map((q) => (
                    <button key={q} onClick={() => { setInput(q); }}
                      className="text-xs px-3 py-1.5 glass rounded-full border border-white/5 text-slate-400 hover:text-brand-400 hover:border-brand-500/30 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white'
                      : msg.role === 'error'
                      ? 'bg-rose-500/20'
                      : 'bg-gradient-to-br from-violet-500 to-brand-500'
                  }`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-white" />}
                  </div>
                  <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-500 text-white rounded-tr-sm'
                        : msg.role === 'error'
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-tl-sm'
                        : 'glass border border-white/5 text-slate-300 rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant'
                        ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown>
                        : msg.content
                      }
                    </div>
                    {msg.role === 'assistant' && (
                      <button onClick={() => copyToClipboard(msg.content)}
                        className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                        <Copy size={10} /> Copy
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-brand-500 flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="glass border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              className="input-field flex-1"
              placeholder="Ask a question about your PDF…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-5 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </motion.div>
      )}

      {/* Non-chat AI Tools */}
      {!isChatTool && files.length > 0 && !result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Processing with AI…</>
              : <><Sparkles size={18} /> Run {tool.name}</>
            }
          </button>
        </motion.div>
      )}

      {/* AI Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400" />
                <h3 className="font-semibold text-slate-200">AI Result</h3>
              </div>
              <div className="flex gap-2">
                {result.type === 'text' && (
                  <button onClick={() => copyToClipboard(result.content)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                    <Copy size={12} /> Copy
                  </button>
                )}
                {result.downloadUrl && (
                  <a href={result.downloadUrl} download className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                    <Download size={12} /> Download
                  </a>
                )}
              </div>
            </div>

            {result.type === 'text' && (
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                <ReactMarkdown>{result.content}</ReactMarkdown>
              </div>
            )}

            {result.type === 'classification' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{result.content.icon || '📄'}</span>
                  <div>
                    <p className="font-semibold text-slate-100 text-lg">{result.content.type}</p>
                    <p className="text-sm text-slate-500">{result.content.confidence}% confidence</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400">{result.content.description}</p>
              </div>
            )}

            {result.type === 'resume' && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(result.content).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{key.replace(/_/g,' ')}</p>
                    <p className="text-slate-300">{Array.isArray(value) ? value.join(', ') : value}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
