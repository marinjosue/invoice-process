# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Final minimal production image
FROM node:22-alpine AS production

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Set permissions and use node user
USER node

# Environment vars
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=400"
# Default Cloud Run port is often 8080, NestJS often uses 3000, but Cloud Run passes PORT env variable. Make sure Nest listens to process.env.PORT.
EXPOSE 8080 3000

CMD ["node", "dist/main"]
