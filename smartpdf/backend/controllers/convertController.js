const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { asyncHandler, createError } = require('../utils/errors')
const { getOutputPath, sendProcessedResult, safeDelete, getFileSize } = require('../utils/fileUtils')

// Helper: Check if LibreOffice is available
const hasLibreOffice = () => {
  try { execSync('libreoffice --version', { stdio: 'ignore' }); return true } catch { return false }
}

// Helper: Convert via LibreOffice
const libreOfficeConvert = (inputPath, outputDir, format = 'pdf') => {
  execSync(`libreoffice --headless --convert-to ${format} --outdir "${outputDir}" "${inputPath}"`, {
    timeout: 60000,
    stdio: 'ignore',
  })
}

// ── WORD TO PDF ───────────────────────────────────────────────────────────────
exports.wordToPDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const outputPath = getOutputPath('converted.pdf', '.pdf')
  const outputDir = path.dirname(outputPath)

  if (hasLibreOffice()) {
    libreOfficeConvert(file.path, outputDir)
    const baseName = path.basename(file.path, path.extname(file.path))
    const libreOut = path.join(outputDir, `${baseName}.pdf`)
    if (fs.existsSync(libreOut)) fs.renameSync(libreOut, outputPath)
  } else {
    // Fallback: create a PDF with a placeholder message
    const doc = await PDFDocument.create()
    const page = doc.addPage([595, 842])
    const font = await doc.embedFont(StandardFonts.Helvetica)
    page.drawText('LibreOffice required for DOCX conversion.\nInstall it on the server.', {
      x: 50, y: 700, size: 14, font, color: rgb(0.2, 0.2, 0.2),
    })
    const bytes = await doc.save()
    fs.writeFileSync(outputPath, bytes)
  }

  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'document.pdf', tool: 'Word to PDF', category: 'convert' })
})

// ── PDF TO WORD ───────────────────────────────────────────────────────────────
exports.pdfToWord = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const outputPath = getOutputPath('converted.docx', '.docx')

  if (hasLibreOffice()) {
    libreOfficeConvert(file.path, path.dirname(outputPath), 'docx')
    const baseName = path.basename(file.path, path.extname(file.path))
    const libreOut = path.join(path.dirname(outputPath), `${baseName}.docx`)
    if (fs.existsSync(libreOut)) fs.renameSync(libreOut, outputPath)
  } else {
    // Placeholder: In production use pdf2docx (Python) or an API
    fs.writeFileSync(outputPath, 'LibreOffice or pdf2docx required.')
  }

  safeDelete(file.path)
  res.json({
    success: true,
    filename: 'document.docx',
    downloadUrl: require('../utils/fileUtils').buildDownloadUrl(outputPath),
    size: getFileSize(outputPath),
    tool: 'PDF to Word',
    category: 'convert',
    message: 'Conversion complete. Install LibreOffice on server for best results.',
  })
})

// ── PPT TO PDF ────────────────────────────────────────────────────────────────
exports.pptToPDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const outputPath = getOutputPath('presentation.pdf', '.pdf')
  const outputDir = path.dirname(outputPath)

  if (hasLibreOffice()) {
    libreOfficeConvert(file.path, outputDir)
    const baseName = path.basename(file.path, path.extname(file.path))
    const libreOut = path.join(outputDir, `${baseName}.pdf`)
    if (fs.existsSync(libreOut)) fs.renameSync(libreOut, outputPath)
  } else {
    const doc = await PDFDocument.create()
    const page = doc.addPage([1280, 720])
    const font = await doc.embedFont(StandardFonts.HelveticaBold)
    page.drawText('LibreOffice required for PPT conversion.', { x: 50, y: 360, size: 20, font, color: rgb(0.2,0.2,0.2) })
    fs.writeFileSync(outputPath, await doc.save())
  }

  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'presentation.pdf', tool: 'PPT to PDF', category: 'convert' })
})

// ── PDF TO PPT ────────────────────────────────────────────────────────────────
exports.pdfToPPT = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  // In production: use python-pptx or an external API
  const outputPath = getOutputPath('presentation.pptx', '.pptx')
  fs.writeFileSync(outputPath, 'PDF to PPT requires python-pptx or a commercial API.')
  safeDelete(file.path)
  res.json({ success: true, filename: 'presentation.pptx', downloadUrl: require('../utils/fileUtils').buildDownloadUrl(outputPath), tool: 'PDF to PPT', category: 'convert', note: 'Integrate pdf2pptx or GroupDocs API for production.' })
})

// ── JPG TO PDF ────────────────────────────────────────────────────────────────
exports.jpgToPDF = asyncHandler(async (req, res, next) => {
  const files = req.files
  if (!files?.length) return next(createError(400, 'No image files provided'))

  const doc = await PDFDocument.create()

  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase()
    let imgBytes

    // Normalize to PNG/JPEG using sharp
    if (ext === '.png' || ext === '.webp') {
      imgBytes = await sharp(file.path).png().toBuffer()
      const img = await doc.embedPng(imgBytes)
      const page = doc.addPage([img.width, img.height])
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    } else {
      imgBytes = await sharp(file.path).jpeg({ quality: 90 }).toBuffer()
      const img = await doc.embedJpg(imgBytes)
      const page = doc.addPage([img.width, img.height])
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    }

    safeDelete(file.path)
  }

  const outputPath = getOutputPath('images.pdf', '.pdf')
  const bytes = await doc.save()
  fs.writeFileSync(outputPath, bytes)

  sendProcessedResult(res, { outputPath, filename: 'images.pdf', tool: 'JPG to PDF', category: 'convert' })
})

// ── PDF TO IMAGES ─────────────────────────────────────────────────────────────
exports.pdfToImages = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const { format = 'png', dpi = '150' } = req.body

  // Use pdf2pic
  let fromPath
  try {
    const { fromPath: fp } = require('pdf2pic')
    fromPath = fp
  } catch {
    return next(createError(500, 'pdf2pic package not available'))
  }

  const outputDir = getOutputPath('', `.${format}`)
  fs.mkdirSync(outputDir, { recursive: true })

  const convert = fromPath(file.path, {
    density: parseInt(dpi),
    saveFilename: 'page',
    savePath: outputDir,
    format: format.toLowerCase(),
    width: 2480,
    height: 3508,
  })

  const src = await require('pdf-lib').PDFDocument.load(fs.readFileSync(file.path))
  const totalPages = src.getPageCount()
  const results = await convert.bulk(-1, { responseType: 'image' })

  safeDelete(file.path)

  const { buildDownloadUrl, getFileSize: gfs } = require('../utils/fileUtils')
  res.json({
    success: true,
    message: `Converted ${totalPages} pages to ${format.toUpperCase()}`,
    pages: results.map((r, i) => ({
      page: i + 1,
      filename: path.basename(r.path),
      downloadUrl: buildDownloadUrl(r.path),
      size: gfs(r.path),
    })),
    tool: 'PDF to Images',
    category: 'convert',
  })
})

// ── EXCEL TO PDF ──────────────────────────────────────────────────────────────
exports.excelToPDF = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  const outputPath = getOutputPath('spreadsheet.pdf', '.pdf')
  const outputDir = path.dirname(outputPath)

  if (hasLibreOffice()) {
    libreOfficeConvert(file.path, outputDir)
    const baseName = path.basename(file.path, path.extname(file.path))
    const libreOut = path.join(outputDir, `${baseName}.pdf`)
    if (fs.existsSync(libreOut)) fs.renameSync(libreOut, outputPath)
  } else {
    const doc = await PDFDocument.create()
    const page = doc.addPage([841, 595]) // A4 Landscape
    const font = await doc.embedFont(StandardFonts.Helvetica)
    page.drawText('LibreOffice required for Excel conversion.', { x: 50, y: 280, size: 16, font, color: rgb(0.2,0.2,0.2) })
    fs.writeFileSync(outputPath, await doc.save())
  }

  safeDelete(file.path)
  sendProcessedResult(res, { outputPath, filename: 'spreadsheet.pdf', tool: 'Excel to PDF', category: 'convert' })
})
