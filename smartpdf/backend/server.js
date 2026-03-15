require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const mongoSanitize = require('express-mongo-sanitize')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
const fs = require('fs')

const connectDB = require('./config/database')
const logger = require('./config/logger')
const { scheduleCleanup } = require('./services/cleanupService')

// Routes
const authRoutes = require('./routes/auth')
const pdfRoutes = require('./routes/pdf')
const convertRoutes = require('./routes/convert')
const editRoutes = require('./routes/edit')
const aiRoutes = require('./routes/ai')
const fileRoutes = require('./routes/files')
const healthRoutes = require('./routes/health')

const app = express()

// Connect Database
connectDB()

// Ensure storage directories exist
const dirs = [
  process.env.UPLOAD_DIR || './uploads',
  process.env.OUTPUT_DIR || './outputs',
  './logs',
]
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many uploads, please try again in 15 minutes.' },
})

app.use('/api/', limiter)
app.use('/api/pdf', uploadLimiter)
app.use('/api/convert', uploadLimiter)
app.use('/api/ai', uploadLimiter)

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(mongoSanitize())
app.use(compression())

// ── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }))
}

// ── Static Files ─────────────────────────────────────────────────────────────
// Serve output files (with auth middleware applied in the files route)
app.use('/outputs', express.static(path.join(__dirname, 'outputs')))

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/pdf', pdfRoutes)
app.use('/api/convert', convertRoutes)
app.use('/api/edit', editRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/files', fileRoutes)

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`)

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  logger.info(`🚀 SmartPDF API running on port ${PORT} [${process.env.NODE_ENV}]`)
})

// Schedule file cleanup
scheduleCleanup()

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

module.exports = app
