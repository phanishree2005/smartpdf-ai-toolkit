const cron = require('node-cron')
const fs = require('fs')
const path = require('path')
const FileRecord = require('../models/FileRecord')
const logger = require('../config/logger')

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const OUTPUT_DIR = process.env.OUTPUT_DIR || './outputs'

const cleanupExpiredFiles = async () => {
  try {
    const expired = await FileRecord.find({
      expiresAt: { $lte: new Date() },
      $or: [{ inputPath: { $ne: null } }, { outputPath: { $ne: null } }],
    }).limit(200)

    let cleaned = 0
    for (const record of expired) {
      try {
        if (record.inputPath && fs.existsSync(record.inputPath)) {
          fs.unlinkSync(record.inputPath)
          const dir = path.dirname(record.inputPath)
          if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
        }
        if (record.outputPath && fs.existsSync(record.outputPath)) {
          fs.unlinkSync(record.outputPath)
          const dir = path.dirname(record.outputPath)
          if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
        }
        record.inputPath = null
        record.outputPath = null
        record.outputAvailable = false
        await record.save()
        cleaned++
      } catch (e) {
        logger.warn(`Cleanup error for record ${record._id}: ${e.message}`)
      }
    }

    if (cleaned > 0) logger.info(`🧹 Cleanup: removed ${cleaned} expired files`)
  } catch (err) {
    logger.error('Cleanup job failed:', err.message)
  }
}

const cleanupOrphanedFiles = async () => {
  // Walk upload/output dirs and delete files older than 2 hours not in DB
  const cleanDir = (dir) => {
    if (!fs.existsSync(dir)) return
    const cutoff = Date.now() - 2 * 60 * 60 * 1000
    const walk = (d) => {
      try {
        const entries = fs.readdirSync(d, { withFileTypes: true })
        entries.forEach((e) => {
          const full = path.join(d, e.name)
          if (e.isDirectory()) {
            walk(full)
            try {
              if (fs.readdirSync(full).length === 0) fs.rmdirSync(full)
            } catch {}
          } else {
            const stat = fs.statSync(full)
            if (stat.mtimeMs < cutoff) {
              try { fs.unlinkSync(full) } catch {}
            }
          }
        })
      } catch {}
    }
    walk(dir)
  }

  cleanDir(UPLOAD_DIR)
  cleanDir(OUTPUT_DIR)
}

const scheduleCleanup = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', cleanupExpiredFiles)
  // Deep cleanup every 2 hours
  cron.schedule('0 */2 * * *', cleanupOrphanedFiles)
  logger.info('🕐 File cleanup scheduler started')
}

module.exports = { scheduleCleanup, cleanupExpiredFiles }
