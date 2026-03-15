const express = require('express')
const router = express.Router()
const { optionalAuth } = require('../middleware/auth')
const { handleUpload } = require('../middleware/upload')
const {
  wordToPDF,
  pdfToWord,
  pptToPDF,
  pdfToPPT,
  jpgToPDF,
  pdfToImages,
  excelToPDF,
} = require('../controllers/convertController')

const up = handleUpload('multiple')
const upSingle = handleUpload('single')

router.post('/word-to-pdf',   optionalAuth, upSingle, wordToPDF)
router.post('/pdf-to-word',   optionalAuth, upSingle, pdfToWord)
router.post('/ppt-to-pdf',    optionalAuth, upSingle, pptToPDF)
router.post('/pdf-to-ppt',    optionalAuth, upSingle, pdfToPPT)
router.post('/jpg-to-pdf',    optionalAuth, up,       jpgToPDF)
router.post('/pdf-to-images', optionalAuth, upSingle, pdfToImages)
router.post('/excel-to-pdf',  optionalAuth, upSingle, excelToPDF)

module.exports = router
