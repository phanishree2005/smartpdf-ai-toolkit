const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const OUTPUT_DIR = process.env.OUTPUT_DIR || './outputs'

/**
 * Ensure output directory exists and return a unique output path
 */
function getOutputPath(filename, ext) {
  const dir = path.join(OUTPUT_DIR, uuidv4())
  fs.mkdirSync(dir, { recursive: true })
  const name = filename || `output_${Date.now()}${ext}`
  return path.join(dir, name)
}

/**
 * Build a downloadable URL from a file path
 */
function buildDownloadUrl(filePath) {
  const relative = path.relative(path.join(__dirname, '..'), filePath)
  return `/${relative.replace(/\\/g, '/')}`
}

/**
 * Safely delete a file, ignoring errors
 */
function safeDelete(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {}
}

/**
 * Safely delete a directory recursively
 */
function safeDeleteDir(dirPath) {
  try {
    if (dirPath && fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true })
  } catch {}
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size
  } catch {
    return 0
  }
}

/**
 * Parse page range string like "1-3,5,8-10" into sorted unique page numbers
 */
function parsePageRange(rangeStr, totalPages) {
  if (!rangeStr) return []
  const pages = new Set()
  rangeStr.split(',').forEach((part) => {
    const [start, end] = part.trim().split('-').map(Number)
    if (!isNaN(start)) {
      if (!isNaN(end)) {
        for (let i = start; i <= Math.min(end, totalPages); i++) pages.add(i)
      } else {
        if (start >= 1 && start <= totalPages) pages.add(start)
      }
    }
  })
  return Array.from(pages).sort((a, b) => a - b)
}

/**
 * Send a file download response
 */
function sendFile(res, filePath, filename, mimeType = 'application/pdf') {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Type', mimeType)
  res.setHeader('Content-Length', getFileSize(filePath))
  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
}

/**
 * Return JSON success response with download info
 */
function sendProcessedResult(res, { outputPath, filename, tool, category, additionalData = {} }) {
  const size = getFileSize(outputPath)
  return res.status(200).json({
    success: true,
    message: 'File processed successfully',
    filename,
    downloadUrl: buildDownloadUrl(outputPath),
    size,
    tool,
    category,
    ...additionalData,
  })
}

module.exports = {
  getOutputPath,
  buildDownloadUrl,
  safeDelete,
  safeDeleteDir,
  getFileSize,
  parsePageRange,
  sendFile,
  sendProcessedResult,
}
