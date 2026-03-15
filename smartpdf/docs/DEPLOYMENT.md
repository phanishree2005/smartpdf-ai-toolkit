# SmartPDF – Deployment Guide

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [AWS Deployment](#aws-deployment)
4. [Environment Variables Reference](#environment-variables-reference)
5. [Recommended Libraries](#recommended-libraries)
6. [Architecture Diagram](#architecture-diagram)

---

## 1. Local Development

### Prerequisites
| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| MongoDB | 6+ | https://mongodb.com |
| Redis | 7+ | https://redis.io |
| LibreOffice | 7+ | `apt install libreoffice` |
| Ghostscript | 10+ | `apt install ghostscript` |
| Tesseract | 5+ | `apt install tesseract-ocr` |

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourname/smartpdf.git
cd smartpdf

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values (MongoDB URI, JWT Secret, OpenAI Key)

# 3. Setup frontend
cd ../frontend
npm install

# 4. Start MongoDB & Redis (macOS with Homebrew)
brew services start mongodb-community
brew services start redis

# 5. Run both servers concurrently
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev

# App runs at: http://localhost:3000
# API runs at: http://localhost:5000
```

---

## 2. Docker Deployment

```bash
# Copy and configure environment
cp backend/.env.example backend/.env
# Fill: JWT_SECRET, OPENAI_API_KEY, etc.

# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up --build -d backend
```

Services started:
- **Frontend** → `http://localhost:3000`
- **Backend API** → `http://localhost:5000`
- **MongoDB** → `localhost:27017`
- **Redis** → `localhost:6379`
- **Nginx** → `http://localhost:80`

---

## 3. AWS Deployment

### Option A: EC2 + Docker Compose (Recommended for hackathons)

```bash
# Launch EC2 t3.medium (Ubuntu 22.04)
# SSH into instance

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER

# Clone and deploy
git clone https://github.com/yourname/smartpdf.git
cd smartpdf
# Set .env
docker-compose up -d

# Setup domain with Certbot (HTTPS)
sudo snap install certbot --classic
sudo certbot --nginx -d yourdomain.com
```

### Option B: AWS ECS + RDS + ElastiCache (Production scale)

```
Architecture:
  Route 53 → CloudFront → ALB → ECS Fargate (Frontend + Backend)
                                    ↓
                             DocumentDB (MongoDB compatible)
                             ElastiCache (Redis)
                             S3 (File storage)
```

---

## 4. Environment Variables Reference

```env
# Required
MONGODB_URI          = MongoDB connection string
JWT_SECRET           = Min 32-char random string (use: openssl rand -hex 32)
OPENAI_API_KEY       = sk-... (from platform.openai.com)

# Optional – defaults shown
PORT                 = 5000
NODE_ENV             = development
REDIS_URL            = redis://localhost:6379
JWT_EXPIRES_IN       = 7d
MAX_FILE_SIZE_MB     = 100
FILE_RETENTION_HOURS = 1
FRONTEND_URL         = http://localhost:3000
RATE_LIMIT_MAX       = 100
LOG_LEVEL            = info
```

---

## 5. Recommended Libraries

### Frontend
| Library | Purpose | Install |
|---------|---------|---------|
| `framer-motion` | Animations | ✅ Included |
| `react-dropzone` | File upload | ✅ Included |
| `@tanstack/react-query` | Data fetching | ✅ Included |
| `zustand` | State management | ✅ Included |
| `react-pdf` | PDF preview | ✅ Included |
| `recharts` | Analytics charts | ✅ Included |
| `react-hot-toast` | Notifications | ✅ Included |
| `react-beautiful-dnd` | Page reordering | ✅ Included |

### Backend
| Library | Purpose | Install |
|---------|---------|---------|
| `pdf-lib` | PDF manipulation | ✅ Included |
| `pdf2pic` | PDF to images | ✅ Included |
| `sharp` | Image processing | ✅ Included |
| `tesseract.js` | OCR | ✅ Included |
| `openai` | AI features | ✅ Included |
| `bull` | Job queue | ✅ Included |
| `multer` | File upload | ✅ Included |
| `pdf-parse` | Text extraction | Add: `npm i pdf-parse` |
| `qpdf` (system) | PDF encryption | `apt install qpdf` |

### AI & Processing (Optional add-ons)
| Tool | Purpose | How |
|------|---------|-----|
| LibreOffice | DOCX/PPTX/XLSX conversion | System install |
| Ghostscript | Real PDF compression | System install |
| Tesseract | OCR for scanned PDFs | System install |
| `langchain` | Advanced RAG for Q&A | ✅ Included |
| `pdf2docx` | PDF→DOCX (Python) | `pip install pdf2docx` |

---

## 6. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        SMARTPDF PLATFORM                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Browser/Client                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  React + Tailwind + Framer Motion + React Query      │   │
│   │  • Landing Page   • Dashboard   • Tool Pages         │   │
│   │  • AI Chat        • History     • Profile            │   │
│   └──────────────────────┬──────────────────────────────┘   │
│                           │ HTTPS                             │
│   ┌───────────────────────▼──────────────────────────────┐   │
│   │                    Nginx Proxy                        │   │
│   └──────┬───────────────────────────────┬───────────────┘   │
│          │                               │                    │
│   ┌──────▼──────┐               ┌────────▼──────────┐        │
│   │  Frontend   │               │   Backend API     │        │
│   │  (React)    │               │   (Node/Express)  │        │
│   │  Port 3000  │               │   Port 5000       │        │
│   └─────────────┘               └────────┬──────────┘        │
│                                          │                    │
│                              ┌───────────┼───────────┐       │
│                              │           │           │       │
│                         ┌────▼───┐  ┌───▼───┐  ┌───▼───┐   │
│                         │MongoDB │  │ Redis │  │OpenAI │   │
│                         │ (data) │  │(queue)│  │(GPT-4)│   │
│                         └────────┘  └───────┘  └───────┘   │
│                                                               │
│   File Flow:                                                  │
│   Upload → Multer → Disk → pdf-lib/LibreOffice → Output       │
│         → FileRecord (MongoDB) → Download URL                 │
│         → Auto-delete after 1h (node-cron)                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Scaling Considerations

| Component | Free Tier | Production |
|-----------|-----------|------------|
| MongoDB | Atlas M0 | Atlas M10+ / DocumentDB |
| Redis | Upstash | ElastiCache |
| Files | Local disk | AWS S3 + CloudFront |
| Compute | Single EC2 t3.micro | ECS Fargate auto-scaling |
| CDN | — | CloudFront / Cloudflare |
| Monitoring | — | Datadog / New Relic |

---

## 8. Security Checklist

- [x] JWT authentication with expiry
- [x] bcrypt password hashing (salt rounds: 12)
- [x] Rate limiting (100 req/15min general, 30 uploads/15min)
- [x] Helmet.js security headers
- [x] MongoDB sanitization (NoSQL injection prevention)
- [x] File type validation (MIME + extension)
- [x] Max file size enforcement
- [x] Auto file deletion after 1 hour
- [x] CORS restricted to frontend origin
- [x] Input validation with express-validator
- [ ] HTTPS/TLS (enable in nginx.conf for production)
- [ ] AWS WAF (for production)
- [ ] File scanning (ClamAV integration)

---

*Built with ❤️ for SmartPDF – National Hackathon Edition*
