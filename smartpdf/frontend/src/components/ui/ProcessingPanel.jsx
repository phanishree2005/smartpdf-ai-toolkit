import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Download, RefreshCw, Loader2 } from 'lucide-react'
import { useFileStore } from '../../context/themeStore'
import { formatBytes } from '../../utils/helpers'

export default function ProcessingPanel({ onRetry }) {
  const { processing, progress, result, error, clearFiles } = useFileStore()

  return (
    <AnimatePresence>
      {(processing || result || error) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="glass-card p-6 space-y-4"
        >
          {/* Processing state */}
          {processing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="text-brand-400 animate-spin" />
                <span className="text-sm font-medium text-slate-300">Processing your file...</span>
                <span className="ml-auto text-sm font-mono text-brand-400">{progress}%</span>
              </div>
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full progress-bar-shine"
                  style={{ background: 'linear-gradient(90deg, #6471f5, #8b5cf6)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-slate-600">
                Using secure servers. Your file will be deleted after processing.
              </p>
            </div>
          )}

          {/* Success state */}
          {result && !processing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Processing complete!</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {result.filename} • {result.size ? formatBytes(result.size) : ''}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={result.downloadUrl}
                  download={result.filename}
                  className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download File
                </a>
                <button
                  onClick={clearFiles}
                  className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  New File
                </button>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !processing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <XCircle size={20} className="text-rose-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-rose-300">Processing failed</p>
                  <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onRetry} className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                  <RefreshCw size={14} />
                  Try Again
                </button>
                <button onClick={clearFiles} className="btn-secondary text-sm py-2.5 px-4">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
