const { PDFDocument } = require('pdf-lib')
const fs = require('fs')
const path = require('path')
const { asyncHandler, createError } = require('../utils/errors')
const { safeDelete, getOutputPath, sendProcessedResult, buildDownloadUrl } = require('../utils/fileUtils')

// Lazy-load OpenAI to avoid errors if not configured
let openai
const getOpenAI = () => {
  if (!openai) {
    const { OpenAI } = require('openai')
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openai
}

// Extract text from PDF using pdf-lib (basic extraction)
const extractTextFromPDF = async (filePath) => {
  try {
    // In production use pdfplumber (Python) or pdf-parse for real text extraction
    const pdfParse = require('pdf-parse')
    const buffer = fs.readFileSync(filePath)
    const data = await pdfParse(buffer)
    return data.text.slice(0, 15000) // Limit to avoid token overflow
  } catch {
    return 'Unable to extract text from this PDF. It may be a scanned document — use OCR first.'
  }
}

const requireOpenAI = (next) => {
  if (!process.env.OPENAI_API_KEY) {
    next(createError(503, 'OpenAI API key not configured. Add OPENAI_API_KEY to environment.'))
    return false
  }
  return true
}

// ── SUMMARIZE ─────────────────────────────────────────────────────────────────
exports.summarize = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  if (!requireOpenAI(next)) return

  const text = await extractTextFromPDF(file.path)
  const ai = getOpenAI()

  const completion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert document analyst. Summarize the document clearly and concisely. Use markdown with headers, bullet points, and key takeaways. Include: Executive Summary, Key Points, Important Details, and Conclusion.',
      },
      { role: 'user', content: `Document text:\n\n${text}` },
    ],
    max_tokens: 1500,
    temperature: 0.3,
  })

  safeDelete(file.path)
  res.json({
    success: true,
    summary: completion.choices[0].message.content,
    tokens: completion.usage?.total_tokens,
    tool: 'AI Summary',
  })
})

// ── ASK QUESTION ──────────────────────────────────────────────────────────────
exports.askQuestion = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  if (!requireOpenAI(next)) return

  const { question, history } = req.body
  if (!question) return next(createError(400, 'Question is required'))

  const text = await extractTextFromPDF(file.path)
  const ai = getOpenAI()

  let historyMessages = []
  try {
    historyMessages = JSON.parse(history || '[]')
  } catch {}

  const messages = [
    {
      role: 'system',
      content: `You are a helpful document assistant. Answer questions based ONLY on the provided document. If the answer is not in the document, say so clearly. Be concise and accurate.\n\nDocument:\n${text}`,
    },
    ...historyMessages.slice(-8), // Keep last 8 messages for context
    { role: 'user', content: question },
  ]

  const completion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 800,
    temperature: 0.2,
  })

  // Don't delete file — user may ask more questions
  res.json({
    success: true,
    answer: completion.choices[0].message.content,
    tokens: completion.usage?.total_tokens,
    tool: 'Ask PDF',
  })
})

// ── EXTRACT TABLES ────────────────────────────────────────────────────────────
exports.extractTables = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  if (!requireOpenAI(next)) return

  const text = await extractTextFromPDF(file.path)
  const ai = getOpenAI()

  const completion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Extract all tables from the document. Return them as JSON array: [{ "title": "Table name", "headers": ["col1","col2"], "rows": [["val1","val2"]] }]. Return ONLY valid JSON, no markdown.',
      },
      { role: 'user', content: `Document:\n${text}` },
    ],
    max_tokens: 2000,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  let tables = []
  try {
    const parsed = JSON.parse(completion.choices[0].message.content)
    tables = parsed.tables || parsed
  } catch {
    tables = []
  }

  // Generate CSV output
  const outputPath = getOutputPath('tables.csv', '.csv')
  let csvContent = ''
  if (Array.isArray(tables) && tables.length > 0) {
    tables.forEach((t, i) => {
      csvContent += `# Table ${i + 1}: ${t.title || 'Untitled'}\n`
      csvContent += t.headers?.join(',') + '\n'
      t.rows?.forEach((row) => { csvContent += row.join(',') + '\n' })
      csvContent += '\n'
    })
  }
  fs.writeFileSync(outputPath, csvContent || 'No tables found')

  safeDelete(file.path)
  res.json({
    success: true,
    tables,
    count: Array.isArray(tables) ? tables.length : 0,
    downloadUrl: buildDownloadUrl(outputPath),
    filename: 'tables.csv',
    tool: 'Table Extraction',
  })
})

// ── CLASSIFY DOCUMENT ─────────────────────────────────────────────────────────
exports.classifyDocument = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  if (!requireOpenAI(next)) return

  const text = await extractTextFromPDF(file.path)
  const ai = getOpenAI()

  const completion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Classify this document. Return JSON: { "type": "Document type", "icon": "relevant emoji", "confidence": 0-100, "description": "brief explanation", "tags": ["tag1","tag2"], "language": "detected language", "sentiment": "positive/neutral/negative", "pageEstimate": number }. ONLY return JSON.',
      },
      { role: 'user', content: `Document (first 3000 chars):\n${text.slice(0, 3000)}` },
    ],
    max_tokens: 500,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  let result = {}
  try {
    result = JSON.parse(completion.choices[0].message.content)
  } catch {
    result = { type: 'Unknown', confidence: 0, description: 'Could not classify document.' }
  }

  safeDelete(file.path)
  res.json({ success: true, ...result, tool: 'Document Classification' })
})

// ── PARSE RESUME ──────────────────────────────────────────────────────────────
exports.parseResume = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  if (!requireOpenAI(next)) return

  const text = await extractTextFromPDF(file.path)
  const ai = getOpenAI()

  const completion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Extract structured data from this resume/CV. Return JSON: { "name": "", "email": "", "phone": "", "location": "", "title": "", "summary": "", "skills": [], "languages": [], "experience": [{"company":"","role":"","duration":"","description":""}], "education": [{"institution":"","degree":"","year":""}], "certifications": [] }. ONLY return JSON.',
      },
      { role: 'user', content: `Resume:\n${text}` },
    ],
    max_tokens: 2000,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  let parsed = {}
  try {
    parsed = JSON.parse(completion.choices[0].message.content)
  } catch {
    parsed = { error: 'Could not parse resume structure' }
  }

  safeDelete(file.path)
  res.json({ success: true, ...parsed, tool: 'Resume Parsing' })
})

// ── TRANSLATE ─────────────────────────────────────────────────────────────────
exports.translateDocument = asyncHandler(async (req, res, next) => {
  const file = req.files?.[0] || req.file
  if (!requireOpenAI(next)) return

  const { targetLanguage = 'spanish' } = req.body
  const text = await extractTextFromPDF(file.path)
  const ai = getOpenAI()

  const completion = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Translate the following document text to ${targetLanguage}. Preserve formatting. Return only the translated text.`,
      },
      { role: 'user', content: text },
    ],
    max_tokens: 4000,
    temperature: 0.2,
  })

  const translated = completion.choices[0].message.content

  // Create PDF with translated text
  const { PDFDocument: PD, StandardFonts, rgb } = require('pdf-lib')
  const doc = await PD.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage([595, 842])

  // Simple text wrapping
  const lines = translated.split('\n')
  let y = 800
  lines.forEach((line) => {
    if (y < 50) {
      const newPage = doc.addPage([595, 842])
      y = 800
    }
    page.drawText(line.slice(0, 90), { x: 40, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) })
    y -= 16
  })

  const outputPath = getOutputPath(`translated_${targetLanguage}.pdf`, '.pdf')
  fs.writeFileSync(outputPath, await doc.save())

  safeDelete(file.path)
  sendProcessedResult(res, {
    outputPath,
    filename: `translated_${targetLanguage}.pdf`,
    tool: 'Translation',
    category: 'ai',
    additionalData: { targetLanguage },
  })
})
