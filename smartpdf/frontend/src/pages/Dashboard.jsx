import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, LayoutGrid, Zap } from 'lucide-react'
import ToolCard from '../components/ui/ToolCard'
import { TOOLS, TOOL_CATEGORIES } from '../utils/tools'
import { useAuthStore } from '../context/themeStore'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = useMemo(() => {
    return TOOLS.filter((t) => {
      const matchSearch = search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'all' || t.category === activeCategory
      return matchSearch && matchCat
    })
  }, [search, activeCategory])

  const categories = [
    { id: 'all', label: 'All Tools', icon: <LayoutGrid size={14} /> },
    ...TOOL_CATEGORIES,
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-100">
              {user ? `Welcome back, ${user.name?.split(' ')[0]} 👋` : 'Document Toolkit'}
            </h1>
            <p className="text-slate-500 mt-1.5">
              {TOOLS.length} tools ready — pick one to get started.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4">
            {[
              { label: 'Files processed', value: user?.stats?.filesProcessed || 0 },
              { label: 'Storage saved', value: `${user?.stats?.storageSaved || 0} MB` },
            ].map(({ label, value }) => (
              <div key={label} className="glass rounded-xl px-5 py-3 text-center border border-white/5">
                <p className="text-xl font-bold text-brand-400">{value}</p>
                <p className="text-xs text-slate-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeCategory === id
                  ? 'bg-brand-500 text-white shadow-glow-sm'
                  : 'glass border border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Tools Banner */}
      {(activeCategory === 'all' || activeCategory === 'ai') && !search && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative glass-card p-6 mb-8 overflow-hidden border border-brand-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 via-violet-600/8 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-100">AI Document Intelligence</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                  NEW
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Chat with PDFs, extract tables, summarize documents, parse resumes — all powered by GPT-4o.
              </p>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-2">
              <Zap size={14} className="text-brand-400" />
              <span className="text-sm text-brand-400 font-medium">6 AI tools available</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tool Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-card"
        >
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No tools found</h3>
          <p className="text-slate-500 text-sm">Try a different search term or category.</p>
          <button
            onClick={() => { setSearch(''); setActiveCategory('all') }}
            className="mt-4 btn-secondary text-sm"
          >
            Clear filters
          </button>
        </motion.div>
      )}
    </div>
  )
}
