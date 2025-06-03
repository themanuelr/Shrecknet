# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /src/app

# Copy only package.json and lock file first (for better cache)
COPY package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy rest of the app (including src and public folders)
COPY . .

# Build Next.js app
RUN npm run build

# 2. Production stage (serving with built-in server)
FROM node:20-alpine

WORKDIR /

# Copy built app and node_modules from builder
COPY --from=builder /src/app ./

EXPOSE 3000
CMD ["npm", "start"]