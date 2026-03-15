const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib')
const fs = require('fs')
const { asyncHandler, createError } = require('../utils/errors')
const { getOutputPath, sendProcessedResult, safeDelete } = require('../utils/fileUtils')

// ── OCR ───────────────────────────────────────────────────────────────────────
exports.ocrPDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file

  let Tesseract
  try {
    Tesseract = require('tesseract.js')
  } catch {
    return next(createError(503, 'Tesseract.js not available'))
  }

  // For PDF: In production, first rasterize with pdf2pic, then OCR each page
  // Here we create a searchable PDF with extracted text layer
  const { data: { text } } = await Tesseract.recognize(file.path, 'eng', {
    logger: () => {},
  })

  const src = await PDFDocument.load(fs.readFileSync(file.path))
  const font = await src.embedFont(StandardFonts.Helvetica)

  // Add invisible text layer for searchability
  const page = src.getPage(0)
  const { width, height } = page.getSize()
  page.drawText(text.slice(0, 500), {
    x: 0, y: 0, size: 1,
    font, color: rgb(1, 1, 1), // Invisible white text
    opacity: 0,
  })

  const outputPath = getOutputPath('ocr_searchable.pdf', '.pdf')
  fs.writeFileSync(outputPath, await src.save())
  safeDelete(file.path)

  res.json({
    success: true,
    filename: 'ocr_searchable.pdf',
    downloadUrl: require('../utils/fileUtils').buildDownloadUrl(outputPath),
    extractedText: text.slice(0, 2000),
    tool: 'OCR',
    category: 'edit',
  })
})

// ── ANNOTATE ──────────────────────────────────────────────────────────────────
exports.annotatePDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { highlights = '[]', comments = '[]' } = req.body

  const src = await PDFDocument.load(fs.readFileSync(file.path))
  const font = await src.embedFont(StandardFonts.Helvetica)

  let parsedHighlights = []
  let parsedComments = []
  try { parsedHighlights = JSON.parse(highlights) } catch {}
  try { parsedComments = JSON.parse(comments) } catch {}

  parsedHighlights.forEach(({ page: pageNum = 1, x, y, width: w, height: h, color = 'yellow' }) => {
    const page = src.getPage(pageNum - 1)
    const colorMap = { yellow: rgb(1, 1, 0), green: rgb(0, 1, 0), pink: rgb(1, 0.5, 0.7) }
    page.drawRectangle({ x, y, width: w, height: h, color: colorMap[color] || rgb(1,1,0), opacity: 0.3 })
  })

  parsedComments.forEach(({ page: pageNum = 1, x, y, text = 'Comment' }) => {
    const page = src.getPage(pageNum - 1)
    page.drawRectangle({ x: x - 2, y: y - 2, width: text.length * 6 + 10, height: 18, color: rgb(1, 1, 0.8), borderColor: rgb(0.8, 0.8, 0), borderWidth: 1 })
    page.drawText(text.slice(0, 60), { x, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
  })

  const outputPath = getOutputPath('annotated.pdf', '.pdf')
  fs.writeFileSync(outputPath, await src.save())
  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'annotated.pdf', tool: 'Annotate PDF', category: 'edit' })
})

// ── DIGITAL SIGNATURE ─────────────────────────────────────────────────────────
exports.signPDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const {
    signatureText = 'Digitally Signed',
    signerName = 'Unknown',
    page: pageNum = 1,
    x = 60, y = 60,
  } = req.body

  const src = await PDFDocument.load(fs.readFileSync(file.path))
  const font = await src.embedFont(StandardFonts.HelveticaBoldOblique)
  const regularFont = await src.embedFont(StandardFonts.Helvetica)
  const page = src.getPage(parseInt(pageNum) - 1)

  const sigWidth = 220
  const sigHeight = 70
  const px = parseFloat(x)
  const py = parseFloat(y)

  // Signature box
  page.drawRectangle({
    x: px, y: py, width: sigWidth, height: sigHeight,
    borderColor: rgb(0.2, 0.2, 0.7),
    borderWidth: 1.5,
    color: rgb(0.97, 0.97, 1),
  })

  // Signature text
  page.drawText(signatureText.slice(0, 30), {
    x: px + 10, y: py + 38,
    size: 18, font, color: rgb(0.1, 0.1, 0.5),
  })

  // Metadata
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  page.drawText(`Signed by: ${signerName}`, { x: px + 10, y: py + 18, size: 8, font: regularFont, color: rgb(0.4, 0.4, 0.4) })
  page.drawText(`Date: ${date}`, { x: px + 10, y: py + 8, size: 8, font: regularFont, color: rgb(0.4, 0.4, 0.4) })

  // Top label
  page.drawText('DIGITALLY SIGNED', { x: px + 8, y: py + sigHeight - 12, size: 7, font: regularFont, color: rgb(0.2, 0.2, 0.7) })

  const outputPath = getOutputPath('signed.pdf', '.pdf')
  fs.writeFileSync(outputPath, await src.save())
  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'signed.pdf', tool: 'Digital Signature', category: 'edit' })
})
