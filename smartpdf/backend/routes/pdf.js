const express = require('express')
const router = express.Router()
const { optionalAuth } = require('../middleware/auth')
const { handleUpload } = require('../middleware/upload')
const {
  mergePDF,
  splitPDF,
  compressPDF,
  rotatePDF,
  deletePages,
  reorderPages,
  extractPages,
  addWatermark,
  addPageNumbers,
  protectPDF,
} = require('../controllers/pdfController')

const up = handleUpload('multiple')
const upSingle = handleUpload('single')

router.post('/merge',        optionalAuth, up,       mergePDF)
router.post('/split',        optionalAuth, upSingle, splitPDF)
router.post('/compress',     optionalAuth, upSingle, compressPDF)
router.post('/rotate',       optionalAuth, upSingle, rotatePDF)
router.post('/delete-pages', optionalAuth, upSingle, deletePages)
router.post('/reorder',      optionalAuth, upSingle, reorderPages)
router.post('/extract',      optionalAuth, upSingle, extractPages)
router.post('/watermark',    optionalAuth, upSingle, addWatermark)
router.post('/page-numbers', optionalAuth, upSingle, addPageNumbers)
router.post('/protect',      optionalAuth, upSingle, protectPDF)

module.exports = router
