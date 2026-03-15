import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useFileStore } from '../../context/themeStore'
import { formatBytes } from '../../utils/helpers'

export default function DropZone({ tool, maxFiles = 20, maxSize = 100 * 1024 * 1024 }) {
  const { files, addFiles, removeFile } = useFileStore()

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      const errors = rejected.map((r) => r.errors[0]?.message).join(', ')
      console.error('Rejected files:', errors)
    }
    addFiles(accepted)
  }, [addFiles])

  const acceptedTypes = buildAcceptMap(tool?.acceptedFiles || ['.pdf'])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxFiles: tool?.multiFile ? maxFiles : 1,
    maxSize,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`drop-zone p-10 text-center select-none transition-all duration-300 ${
          isDragActive && !isDragReject ? 'border-brand-400 bg-brand-500/10' : ''
        } ${isDragReject ? 'border-rose-500 bg-rose-500/10' : ''}`}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="drag"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="space-y-3"
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                isDragReject ? 'bg-rose-500/20' : 'bg-brand-500/20'
              }`}>
                {isDragReject
                  ? <AlertCircle size={32} className="text-rose-400" />
                  : <Upload size={32} className="text-brand-400 animate-bounce" />
                }
              </div>
              <p className={`font-semibold text-lg ${isDragReject ? 'text-rose-400' : 'text-brand-400'}`}>
                {isDragReject ? 'File type not supported!' : 'Drop your files here!'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-brand-500/10 rounded-2xl animate-pulse-slow" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-brand-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center border border-brand-500/20">
                  <Upload size={32} className="text-brand-400" />
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold text-slate-200">
                  Drop files here, or{' '}
                  <span className="text-brand-400 underline underline-offset-4 decoration-dashed cursor-pointer hover:text-brand-300 transition-colors">
                    browse
                  </span>
                </p>
                <p className="text-sm text-slate-500 mt-1.5">
                  {tool?.multiFile ? `Up to ${maxFiles} files` : 'Single file'} • Max {formatBytes(maxSize)} •{' '}
                  {tool?.acceptedFiles?.join(', ').toUpperCase() || 'PDF'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs text-slate-600">
                {['SSL Encrypted', 'Auto-deleted in 1h', 'GDPR Compliant'].map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-emerald-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-1">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </p>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-brand-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <File size={16} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function buildAcceptMap(extensions) {
  const map = {
    '.pdf': { 'application/pdf': ['.pdf'] },
    '.doc': { 'application/msword': ['.doc'] },
    '.docx': { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    '.ppt': { 'application/vnd.ms-powerpoint': ['.ppt'] },
    '.pptx': { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
    '.xls': { 'application/vnd.ms-excel': ['.xls'] },
    '.xlsx': { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    '.jpg': { 'image/jpeg': ['.jpg', '.jpeg'] },
    '.jpeg': { 'image/jpeg': ['.jpg', '.jpeg'] },
    '.png': { 'image/png': ['.png'] },
    '.webp': { 'image/webp': ['.webp'] },
    '.csv': { 'text/csv': ['.csv'] },
  }
  return extensions.reduce((acc, ext) => ({ ...acc, ...(map[ext] || {}) }), {})
}
