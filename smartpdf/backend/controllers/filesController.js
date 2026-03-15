const fs = require('fs')
const path = require('path')
const FileRecord = require('../models/FileRecord')
const { asyncHandler, createError } = require('../utils/errors')
const { safeDelete } = require('../utils/fileUtils')

exports.getHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, category } = req.query
  const query = { userId: req.user._id }
  if (category && category !== 'all') query.category = category

  const files = await FileRecord.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean()

  const total = await FileRecord.countDocuments(query)

  res.json({
    success: true,
    files,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  })
})

exports.getStats = asyncHandler(async (req, res) => {
  const uid = req.user._id
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [total, thisMonth, totalSize] = await Promise.all([
    FileRecord.countDocuments({ userId: uid }),
    FileRecord.countDocuments({ userId: uid, createdAt: { $gte: monthStart } }),
    FileRecord.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: null, total: { $sum: '$size' } } },
    ]),
  ])

  res.json({
    success: true,
    stats: {
      total,
      thisMonth,
      storageUsed: totalSize[0]?.total || 0,
    },
  })
})

exports.downloadFile = asyncHandler(async (req, res, next) => {
  const record = await FileRecord.findOne({ _id: req.params.id, userId: req.user._id })
  if (!record) return next(createError(404, 'File not found'))
  if (!record.outputAvailable || !record.outputPath) return next(createError(410, 'File has expired'))
  if (!fs.existsSync(record.outputPath)) return next(createError(410, 'File has been deleted'))

  record.downloadCount += 1
  await record.save()

  res.download(record.outputPath, record.outputFilename || record.filename)
})

exports.deleteFile = asyncHandler(async (req, res, next) => {
  const record = await FileRecord.findOne({ _id: req.params.id, userId: req.user._id })
  if (!record) return next(createError(404, 'File not found'))

  safeDelete(record.inputPath)
  safeDelete(record.outputPath)
  await record.deleteOne()

  res.json({ success: true, message: 'File deleted' })
})
