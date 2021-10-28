# Based on:
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# Install dependencies
FROM node:16.13.0-alpine3.14 AS deps
LABEL maintainer="Specify Collections Consortium <github.com/specify>"

RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci


# Build source code
FROM node:16.13.0-alpine3.14 AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build


# Development image
FROM node:16.13.0-alpine3.14 AS runner-common
WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001


FROM runner-common AS dev-runner
COPY . .
RUN npm i --no-save @swc/core @swc/cli
RUN npm i

ENV NODE_ENV development
USER nextjs
CMD ["npm", "run", "dev"]


# Production image, copy all the files and run next
FROM runner-common AS runner

ENV NODE_ENV production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
CMD ["npm", "run", "start"]
