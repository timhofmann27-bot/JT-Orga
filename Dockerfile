# Stage 1: Build the frontend
FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Run the server
FROM node:22-slim

WORKDIR /app

# Install dependencies for better-sqlite3 (if needed, though slim usually has what's needed for prebuilds)
# better-sqlite3 usually downloads a prebuilt binary, but sometimes needs build tools.
# Let's include them just in case, or use a slightly larger base if it fails.
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/server.ts ./server.ts

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--experimental-strip-types", "server.ts"]
