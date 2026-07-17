FROM node:18-alpine AS base

WORKDIR /app

# Install production dependencies in a separate layer for better cache reuse.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5050/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
