# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build the Next.js app
RUN npm run build

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# System dependencies required by Remotion's Chrome Headless Shell and FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    # Chrome headless dependencies
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy built app and production deps from previous stages
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules

# Pre-download Remotion's Chrome Headless Shell so it's baked into the image
# (avoids downloading at runtime, which would slow the first render)
RUN node -e "const {ensureBrowser} = require('@remotion/renderer'); ensureBrowser().then(() => console.log('Chrome ready')).catch(console.error)"

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Remotion needs to know the public-facing URL so audio files resolve correctly
ENV NEXT_PUBLIC_SITE_URL=http://localhost:3000

EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
