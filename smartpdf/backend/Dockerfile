FROM node:20-alpine

# Install system dependencies for LibreOffice, Ghostscript, Tesseract
RUN apk add --no-cache \
    libreoffice \
    ghostscript \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    python3 \
    py3-pip \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Create required directories
RUN mkdir -p uploads outputs logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

EXPOSE 5000

# Run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
RUN chown -R nodeuser:nodejs /app
USER nodeuser

CMD ["node", "server.js"]
