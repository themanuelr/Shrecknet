# 1. Build stage
FROM node:20-bullseye AS builder

WORKDIR /src/app

COPY package*.json ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

# 2. Production stage (serving with built-in server)
FROM node:20-bullseye

WORKDIR /app

# --- ADD THESE TWO LINES HERE ---
#RUN addgroup -g 33 www-data && adduser -D -u 33 -G www-data www-data
RUN adduser -D -u 33 -G www-data www-data || true

# Copy built app and node_modules from builder
COPY --from=builder /src/app ./

EXPOSE 3000

# --- If using Docker Compose, set the user there (preferred) ---
CMD ["npm", "start"]

# --- If NOT using Docker Compose, set user here (optional) ---
# USER 33:33
# CMD ["npm", "start"]
