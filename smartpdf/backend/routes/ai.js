const express = require('express')
const router = express.Router()
const { optionalAuth, requirePro } = require('../middleware/auth')
const { handleUpload } = require('../middleware/upload')
const {
  summarize,
  askQuestion,
  extractTables,
  classifyDocument,
  parseResume,
  translateDocument,
} = require('../controllers/aiController')

const upSingle = handleUpload('single')

router.post('/summarize',     optionalAuth, upSingle, summarize)
router.post('/ask',           optionalAuth, upSingle, askQuestion)
router.post('/extract-tables',optionalAuth, upSingle, extractTables)
router.post('/classify',      optionalAuth, upSingle, classifyDocument)
router.post('/parse-resume',  optionalAuth, upSingle, parseResume)
router.post('/translate',     optionalAuth, upSingle, translateDocument)

module.exports = router
