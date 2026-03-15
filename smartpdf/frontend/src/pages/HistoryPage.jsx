import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { History, Download, Trash2, FileText, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { historyAPI } from '../utils/api'
import { formatDate, formatBytes, truncate } from '../utils/helpers'

export default function HistoryPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => historyAPI.getAll().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => historyAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries(['history']); toast.success('File deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const handleDownload = async (file) => {
    try {
      const res = await historyAPI.download(file._id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = file.outputFilename || file.filename
      a.click(); URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch { toast.error('Download failed') }
  }

  const files = data?.files || []
  const filtered = files.filter((f) => {
    const matchSearch = !search || f.filename?.toLowerCase().includes(search.toLowerCase()) || f.tool?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || f.category === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center">
            <History size={18} className="text-brand-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-100">File History</h1>
        </div>
        <p className="text-slate-500 ml-13">Your processed files from the last 24 hours.</p>
      </motion.div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Processed', value: data.stats.total },
            { label: 'Storage Used', value: formatBytes(data.stats.storageUsed) },
            { label: 'This Month', value: data.stats.thisMonth },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card p-5 text-center">
              <p className="text-2xl font-bold text-brand-400">{value}</p>
              <p className="text-xs text-slate-600 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input-field pl-10 text-sm" placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-40 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All categories</option>
          <option value="organize">Organize</option>
          <option value="convert">Convert</option>
          <option value="edit">Edit</option>
          <option value="ai">AI Tools</option>
        </select>
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-48" />
                  <div className="h-3 bg-white/5 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 glass-card">
          <FileText size={40} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No files yet</h3>
          <p className="text-slate-600 text-sm">Processed files appear here for 24 hours.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((file, i) => (
            <motion.div
              key={file._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 flex items-center gap-4 group"
            >
              <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                📄
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{truncate(file.filename, 50)}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-500">{file.tool}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-slate-600">{formatBytes(file.size)}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-slate-600">{formatDate(file.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {file.outputAvailable && (
                  <button onClick={() => handleDownload(file)}
                    className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-all"
                    title="Download">
                    <Download size={15} />
                  </button>
                )}
                <button onClick={() => deleteMutation.mutate(file._id)}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                  title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                file.status === 'completed' ? 'bg-emerald-400' :
                file.status === 'failed' ? 'bg-rose-400' : 'bg-amber-400'
              }`} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
