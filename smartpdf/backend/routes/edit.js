const express = require('express')
const router = express.Router()
const { optionalAuth } = require('../middleware/auth')
const { handleUpload } = require('../middleware/upload')
const { ocrPDF, annotatePDF, signPDF } = require('../controllers/editController')

const upSingle = handleUpload('single')

router.post('/ocr',      optionalAuth, upSingle, ocrPDF)
router.post('/annotate', optionalAuth, upSingle, annotatePDF)
router.post('/sign',     optionalAuth, upSingle, signPDF)

module.exports = router
