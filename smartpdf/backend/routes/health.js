const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

router.get('/', (req, res) => {
  const uptime = process.uptime()
  const mem = process.memoryUsage()

  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

module.exports = router
