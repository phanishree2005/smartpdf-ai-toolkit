const { PDFDocument, degrees, rgb, StandardFonts, PageSizes } = require('pdf-lib')
const fs = require('fs')
const path = require('path')
const { asyncHandler, createError } = require('../utils/errors')
const { getOutputPath, sendProcessedResult, safeDelete, parsePageRange } = require('../utils/fileUtils')
const FileRecord = require('../models/FileRecord')

// Helper: load PDF bytes and create PDFDocument
const loadPDF = async (filePath) => {
  const bytes = fs.readFileSync(filePath)
  return PDFDocument.load(bytes)
}

// Helper: save PDF to output path
const savePDF = async (pdfDoc, outputPath) => {
  const bytes = await pdfDoc.save()
  fs.writeFileSync(outputPath, bytes)
}

// Helper: record file in DB
const recordFile = async (req, { tool, category, inputFile, outputPath, outputFilename, options = {} }) => {
  try {
    const size = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0
    return await FileRecord.create({
      userId: req.user?._id || null,
      tool,
      category,
      filename: inputFile.originalname,
      outputFilename,
      inputPath: inputFile.path,
      outputPath,
      size: inputFile.size,
      outputSize: size,
      status: 'completed',
      options,
      outputAvailable: true,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })
  } catch (e) {
    // Non-critical — don't fail the request
    console.error('FileRecord error:', e.message)
  }
}

// ── MERGE ─────────────────────────────────────────────────────────────────────
exports.mergePDF = asyncHandler(async (req, res, next) => {
  const files = req.files
  if (!files || files.length < 2) return next(createError(400, 'At least 2 PDF files required'))

  const merged = await PDFDocument.create()
  for (const file of files) {
    const src = await loadPDF(file.path)
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }

  const outputPath = getOutputPath('merged.pdf', '.pdf')
  await savePDF(merged, outputPath)

  files.forEach((f) => safeDelete(f.path))
  sendProcessedResult(res, { outputPath, filename: 'merged.pdf', tool: 'Merge PDF', category: 'organize' })
})

// ── SPLIT ─────────────────────────────────────────────────────────────────────
exports.splitPDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { mode = 'byPage', range, n } = req.body

  const src = await loadPDF(file.path)
  const totalPages = src.getPageCount()

  let groups = [] // Array of page-index arrays

  if (mode === 'byPage') {
    groups = src.getPageIndices().map((i) => [i])
  } else if (mode === 'byRange' && range) {
    const pages = parsePageRange(range, totalPages)
    groups = pages.map((p) => [p - 1])
  } else if (mode === 'everyN' && n) {
    const num = parseInt(n)
    for (let i = 0; i < totalPages; i += num) {
      groups.push(Array.from({ length: Math.min(num, totalPages - i) }, (_, j) => i + j))
    }
  } else {
    groups = src.getPageIndices().map((i) => [i])
  }

  const outputPaths = []
  for (let gi = 0; gi < groups.length; gi++) {
    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(src, groups[gi])
    pages.forEach((p) => doc.addPage(p))
    const outPath = getOutputPath(`part_${gi + 1}.pdf`, '.pdf')
    await savePDF(doc, outPath)
    outputPaths.push(outPath)
  }

  safeDelete(file.path)

  // If only 1 part, send directly. Otherwise, zip them.
  if (outputPaths.length === 1) {
    return sendProcessedResult(res, { outputPath: outputPaths[0], filename: 'split_part_1.pdf', tool: 'Split PDF', category: 'organize' })
  }

  // For multiple parts, return array of download URLs
  const { buildDownloadUrl, getFileSize } = require('../utils/fileUtils')
  res.json({
    success: true,
    message: `Split into ${outputPaths.length} files`,
    parts: outputPaths.map((p, i) => ({
      filename: `part_${i + 1}.pdf`,
      downloadUrl: buildDownloadUrl(p),
      size: getFileSize(p),
    })),
    tool: 'Split PDF',
    category: 'organize',
  })
})

// ── COMPRESS ──────────────────────────────────────────────────────────────────
exports.compressPDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { quality = 'medium' } = req.body

  // pdf-lib doesn't perform lossy compression, but we can re-serialize
  // In production, pipe through Ghostscript for real compression
  const src = await loadPDF(file.path)
  const outputPath = getOutputPath('compressed.pdf', '.pdf')

  // Save with compression flags
  const bytes = await src.save({ useObjectStreams: quality !== 'low' })
  fs.writeFileSync(outputPath, bytes)

  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'compressed.pdf', tool: 'Compress PDF', category: 'organize' })
})

// ── ROTATE ────────────────────────────────────────────────────────────────────
exports.rotatePDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const angle = parseInt(req.body.angle) || 90
  const pagesParam = req.body.pages

  const src = await loadPDF(file.path)
  const total = src.getPageCount()
  const targetPages = pagesParam
    ? parsePageRange(pagesParam, total)
    : Array.from({ length: total }, (_, i) => i + 1)

  targetPages.forEach((pageNum) => {
    const page = src.getPage(pageNum - 1)
    page.setRotation(degrees(angle))
  })

  const outputPath = getOutputPath('rotated.pdf', '.pdf')
  await savePDF(src, outputPath)
  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'rotated.pdf', tool: 'Rotate PDF', category: 'organize' })
})

// ── DELETE PAGES ──────────────────────────────────────────────────────────────
exports.deletePages = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { pageRange } = req.body
  if (!pageRange) return next(createError(400, 'pageRange is required'))

  const src = await loadPDF(file.path)
  const total = src.getPageCount()
  const toDelete = new Set(parsePageRange(pageRange, total).map((p) => p - 1))
  const keepIndices = src.getPageIndices().filter((i) => !toDelete.has(i))

  if (keepIndices.length === 0) return next(createError(400, 'Cannot delete all pages'))

  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, keepIndices)
  pages.forEach((p) => out.addPage(p))

  const outputPath = getOutputPath('pages_deleted.pdf', '.pdf')
  await savePDF(out, outputPath)
  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'pages_deleted.pdf', tool: 'Delete Pages', category: 'organize' })
})

// ── REORDER PAGES ─────────────────────────────────────────────────────────────
exports.reorderPages = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  let { pageOrder } = req.body

  const src = await loadPDF(file.path)
  const total = src.getPageCount()

  // pageOrder: comma-separated 1-based page numbers in new order
  let order = pageOrder
    ? pageOrder.split(',').map((n) => parseInt(n.trim()) - 1)
    : src.getPageIndices()

  order = order.filter((i) => i >= 0 && i < total)

  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, order)
  pages.forEach((p) => out.addPage(p))

  const outputPath = getOutputPath('reordered.pdf', '.pdf')
  await savePDF(out, outputPath)
  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'reordered.pdf', tool: 'Reorder Pages', category: 'organize' })
})

// ── EXTRACT PAGES ─────────────────────────────────────────────────────────────
exports.extractPages = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { pageRange } = req.body
  if (!pageRange) return next(createError(400, 'pageRange is required'))

  const src = await loadPDF(file.path)
  const total = src.getPageCount()
  const indices = parsePageRange(pageRange, total).map((p) => p - 1)

  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, indices)
  pages.forEach((p) => out.addPage(p))

  const outputPath = getOutputPath('extracted.pdf', '.pdf')
  await savePDF(out, outputPath)
  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'extracted.pdf', tool: 'Extract Pages', category: 'organize' })
})

// ── ADD WATERMARK ─────────────────────────────────────────────────────────────
exports.addWatermark = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { text = 'CONFIDENTIAL', opacity = 30, position = 'center' } = req.body

  const src = await loadPDF(file.path)
  const font = await src.embedFont(StandardFonts.HelveticaBold)
  const opacityFloat = Math.min(parseFloat(opacity) / 100, 1)

  const pages = src.getPages()
  pages.forEach((page) => {
    const { width, height } = page.getSize()
    const fontSize = Math.min(width, height) * 0.07
    const textWidth = font.widthOfTextAtSize(text, fontSize)
    const textHeight = font.heightAtSize(fontSize)

    let x, y
    switch (position) {
      case 'top-left':    x = 40; y = height - textHeight - 40; break
      case 'top-right':   x = width - textWidth - 40; y = height - textHeight - 40; break
      case 'bottom-left': x = 40; y = 40; break
      case 'bottom-right':x = width - textWidth - 40; y = 40; break
      default: x = (width - textWidth) / 2; y = (height - textHeight) / 2
    }

    page.drawText(text, {
      x, y,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: opacityFloat,
      rotate: position === 'center' ? degrees(-45) : degrees(0),
    })
  })

  const outputPath = getOutputPath('watermarked.pdf', '.pdf')
  await savePDF(src, outputPath)
  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'watermarked.pdf', tool: 'Add Watermark', category: 'security' })
})

// ── ADD PAGE NUMBERS ──────────────────────────────────────────────────────────
exports.addPageNumbers = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { position = 'bottom-center', startFrom = 1 } = req.body
  const start = parseInt(startFrom) || 1

  const src = await loadPDF(file.path)
  const font = await src.embedFont(StandardFonts.Helvetica)
  const fontSize = 11

  src.getPages().forEach((page, idx) => {
    const { width, height } = page.getSize()
    const pageNum = `${start + idx}`
    const textWidth = font.widthOfTextAtSize(pageNum, fontSize)

    let x, y
    switch (position) {
      case 'top-left':    x = 40; y = height - 30; break
      case 'top-right':   x = width - textWidth - 40; y = height - 30; break
      case 'top-center':  x = (width - textWidth) / 2; y = height - 30; break
      case 'bottom-left': x = 40; y = 20; break
      case 'bottom-right':x = width - textWidth - 40; y = 20; break
      default:            x = (width - textWidth) / 2; y = 20
    }

    page.drawText(pageNum, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) })
  })

  const outputPath = getOutputPath('numbered.pdf', '.pdf')
  await savePDF(src, outputPath)
  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'numbered.pdf', tool: 'Add Page Numbers', category: 'security' })
})

// ── PROTECT PDF ───────────────────────────────────────────────────────────────
exports.protectPDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { password } = req.body
  if (!password) return next(createError(400, 'Password is required'))

  // pdf-lib doesn't natively support encryption.
  // In production: spawn qpdf or use hummus. Here we simulate.
  const src = await loadPDF(file.path)
  const outputPath = getOutputPath('protected.pdf', '.pdf')

  // NOTE: Real encryption requires qpdf:
  // execSync(`qpdf --encrypt ${password} ${password} 256 -- ${file.path} ${outputPath}`)
  await savePDF(src, outputPath)

  safeDelete(file.path)
  sendProcessedResult(res, {
    outputPath,
    filename: 'protected.pdf',
    tool: 'Protect PDF',
    category: 'security',
    additionalData: { note: 'Install qpdf on server for real AES-256 encryption.' },
  })
})
