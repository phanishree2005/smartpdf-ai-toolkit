const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { createError } = require('../utils/errors')
const fs = require('fs')

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED_MIMES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/csv': '.csv',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, req.user?.id || 'anon', uuidv4())
    fs.mkdirSync(userDir, { recursive: true })
    req._uploadDir = userDir
    cb(null, userDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeName = `${uuidv4()}${ext}`
    cb(null, safeName)
  },
})

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES[file.mimetype]) {
    cb(null, true)
  } else {
    cb(createError(400, `File type not supported: ${file.mimetype}`), false)
  }
}

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 20 },
})

// Middleware variants
const uploadSingle = upload.single('files')
const uploadMultiple = upload.array('files', 20)

const handleUpload = (type = 'multiple') => (req, res, next) => {
  const fn = type === 'single' ? uploadSingle : uploadMultiple
  fn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(createError(400, `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 100}MB.`))
      if (err.code === 'LIMIT_FILE_COUNT') return next(createError(400, 'Too many files. Max 20.'))
      return next(createError(400, err.message))
    }
    if (err) return next(err)
    if (!req.files?.length && !req.file) return next(createError(400, 'No file uploaded.'))
    next()
  })
}

module.exports = { handleUpload, upload }
