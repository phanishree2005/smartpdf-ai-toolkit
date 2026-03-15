import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowLeft, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { getToolById } from '../utils/tools'
import { useFileStore } from '../context/themeStore'
import DropZone from '../components/ui/DropZone'
import ProcessingPanel from '../components/ui/ProcessingPanel'
import ToolOptions from '../components/tools/ToolOptions'
import { pdfAPI, convertAPI } from '../utils/api'

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)
  const { files, processing, result, setProcessing, setProgress, setResult, setError } = useFileStore()
  const [options, setOptions] = useState({})

  if (!tool) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-6xl mb-4">🔧</p>
        <h2 className="text-2xl font-bold text-slate-200 mb-2">Tool not found</h2>
        <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file.')
      return
    }
    if (!tool.multiFile && files.length > 1) {
      toast.error('This tool accepts only one file.')
      return
    }

    setProcessing(true)
    setProgress(10)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 85))
      }, 400)

      let response
      const file = files[0]

      // Route to correct API
      switch (tool.id) {
        case 'merge-pdf':    response = await pdfAPI.merge(files, options); break
        case 'split-pdf':    response = await pdfAPI.split(file, options); break
        case 'compress-pdf': response = await pdfAPI.compress(file, options); break
        case 'rotate-pdf':   response = await pdfAPI.rotate(file, options); break
        case 'delete-pages': response = await pdfAPI.deletePages(file, options); break
        case 'reorder-pages':response = await pdfAPI.reorderPages(file, options); break
        case 'extract-pages':response = await pdfAPI.extractPages(file, options); break
        case 'add-watermark':response = await pdfAPI.addWatermark(file, options); break
        case 'page-numbers': response = await pdfAPI.addPageNumbers(file, options); break
        case 'protect-pdf':  response = await pdfAPI.protect(file, options); break
        case 'word-to-pdf':  response = await convertAPI.wordToPdf(file); break
        case 'pdf-to-word':  response = await convertAPI.pdfToWord(file); break
        case 'ppt-to-pdf':   response = await convertAPI.pptToPdf(file); break
        case 'pdf-to-ppt':   response = await convertAPI.pdfToPpt(file); break
        case 'jpg-to-pdf':   response = await convertAPI.jpgToPdf(files); break
        case 'pdf-to-images':response = await convertAPI.pdfToImages(file, options); break
        case 'excel-to-pdf': response = await convertAPI.excelToPdf(file); break
        default: throw new Error('Tool not implemented yet')
      }

      clearInterval(progressInterval)
      setProgress(100)
      setResult({
        downloadUrl: response.data.downloadUrl,
        filename: response.data.filename,
        size: response.data.size,
      })
      toast.success('File processed successfully!')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Processing failed. Please try again.')
      toast.error('Processing failed.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          All tools
        </Link>
      </motion.div>

      {/* Tool Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-start gap-4 mb-8"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${tool.color}20`, border: `1px solid ${tool.color}30` }}
        >
          {tool.icon}
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">{tool.name}</h1>
          <p className="text-slate-500 mt-1 text-sm">{tool.description}</p>
        </div>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <DropZone tool={tool} />
      </motion.div>

      {/* Tool-specific Options */}
      {tool.options && files.length > 0 && !result && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <ToolOptions tool={tool} options={options} onChange={setOptions} />
        </motion.div>
      )}

      {/* Process Button */}
      {files.length > 0 && !result && !processing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <button
            onClick={handleProcess}
            className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2.5 group"
          >
            <Zap size={18} className="group-hover:scale-110 transition-transform" fill="white" />
            Process with SmartPDF
          </button>
        </motion.div>
      )}

      {/* Processing / Result / Error panel */}
      <ProcessingPanel onRetry={handleProcess} />

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 glass rounded-2xl p-6 border border-white/5"
      >
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">How it works</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '01', text: 'Upload your file(s)' },
            { step: '02', text: 'Set options & process' },
            { step: '03', text: 'Download the result' },
          ].map(({ step, text }) => (
            <div key={step} className="text-center">
              <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-xs font-bold text-brand-400">{step}</span>
              </div>
              <p className="text-xs text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
