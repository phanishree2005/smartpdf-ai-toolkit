const express = require('express')
const router = express.Router()
const { protect, optionalAuth } = require('../middleware/auth')
const { getHistory, downloadFile, deleteFile, getStats } = require('../controllers/filesController')

router.get('/history', protect, getHistory)
router.get('/stats',   protect, getStats)
router.get('/download/:id', protect, downloadFile)
router.delete('/:id',  protect, deleteFile)

module.exports = router
