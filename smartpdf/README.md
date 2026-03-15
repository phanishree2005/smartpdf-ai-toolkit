# SmartPDF – AI Document Toolkit 🚀

> A national-level, production-ready PDF processing platform with AI capabilities.
> Built for hackathons, portfolios, and real-world deployment.

![SmartPDF Banner](docs/banner.png)

---

## 🌟 Features

### PDF Tools (30+)
- **Basic**: Merge, Split, Compress, Rotate, Delete Pages, Reorder, Extract Pages
- **Watermark & Security**: Add Watermark, Page Numbers, Password Protect
- **Conversions**: Word↔PDF, PPT↔PDF, JPG↔PDF, PDF→Images, Excel→PDF
- **Advanced Editing**: Edit Text, Highlight/Annotate, Digital Signature, OCR
- **AI-Powered**: Summary, Q&A Chat, Table Extraction, Classification, Resume Parsing, Translation

### Platform Features
- 🔐 JWT Authentication + OAuth (Google)
- 📂 Drag & Drop with batch upload
- 📜 File history & download manager
- 🌙 Dark / Light mode
- 📱 Fully responsive (mobile-first)
- ⚡ Redis job queue for processing
- ☁️ Cloud-ready (Docker + AWS/GCP)

---

## 🗂 Project Structure

```
smartpdf/
├── frontend/          # React + Tailwind CSS app
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # Auth, Theme contexts
│   │   └── utils/        # API clients, helpers
│   └── package.json
├── backend/           # Node.js + Express API
│   ├── routes/        # API route definitions
│   ├── controllers/   # Business logic
│   ├── models/        # MongoDB schemas
│   ├── services/      # PDF processing, AI, Queue
│   ├── middleware/    # Auth, rate-limit, upload
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis 7+
- Python 3.10+ (for AI tools)

### 1. Clone & Install

```bash
git clone https://github.com/yourname/smartpdf.git
cd smartpdf

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Variables

```bash
# backend/.env
cp backend/.env.example backend/.env
# Fill in: MONGODB_URI, JWT_SECRET, REDIS_URL, OPENAI_API_KEY, etc.
```

### 3. Run Development

```bash
# Terminal 1 – Backend
cd backend && npm run dev

# Terminal 2 – Frontend
cd frontend && npm run dev
```

### 4. Docker (Production)

```bash
docker-compose up --build
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS 3, Framer Motion, React Query |
| Backend | Node.js 20, Express 5, Multer, Bull Queue |
| Database | MongoDB + Mongoose, Redis |
| PDF Engine | pdf-lib, pdf2pic, libreoffice, Ghostscript |
| AI | OpenAI GPT-4o, LangChain, Tesseract OCR |
| Auth | JWT, bcrypt, Google OAuth 2.0 |
| Storage | Local / AWS S3 / Cloudinary |
| Deployment | Docker, Nginx, PM2, GitHub Actions CI/CD |

---

## 🔌 API Reference

Base URL: `https://api.smartpdf.io/v1`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login, get JWT |
| `/pdf/merge` | POST | Merge PDFs |
| `/pdf/split` | POST | Split PDF |
| `/pdf/compress` | POST | Compress PDF |
| `/pdf/convert/word-to-pdf` | POST | Word → PDF |
| `/ai/summarize` | POST | AI Summary |
| `/ai/ask` | POST | Chat with PDF |
| `/files/history` | GET | User file history |

---

## 🏆 Hackathon Highlights

- **Architecture**: Microservice-ready monorepo
- **Scalability**: Job queue handles 1000+ concurrent jobs
- **Security**: OWASP-compliant, rate limiting, file validation
- **AI Integration**: GPT-4o powered document intelligence
- **DevOps**: Full Docker + CI/CD pipeline included

---

## 📄 License

MIT © 2026 SmartPDF Team
by phanishree N