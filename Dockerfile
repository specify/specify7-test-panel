# Based on:
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# Install dependencies
FROM node:16.13.0-alpine3.14 AS deps

# RUN apk add --no-cache libc6-compat
WORKDIR /home/node/app
COPY app/package*.json ./
RUN npm ci


# Build source code
FROM node:16.13.0-alpine3.14 AS builder

WORKDIR /home/node/app
COPY app .
COPY --from=deps /home/node/app/node_modules ./node_modules
RUN npm run build


# Common for production & development deployments
FROM node:16.13.0-alpine3.14 AS runner-common
LABEL maintainer="Specify Collections Consortium <github.com/specify>"

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

RUN apk add --no-cache mariadb-client


# Development image
FROM runner-common AS dev-runner

WORKDIR /home/node/app
ENV NODE_ENV development
USER nextjs

COPY app .
COPY docker-entrypoint.sh ../
ENTRYPOINT ["../docker-entrypoint.sh"]


# Production image, copy all files and run next
FROM runner-common AS runner

WORKDIR /home/node/app
ENV NODE_ENV production
USER nextjs

COPY --from=builder /home/node/app/next.config.js ./
COPY --from=builder /home/node/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /home/node/app/.next ./.next
COPY --from=builder /home/node/app/node_modules ./node_modules
COPY --from=builder /home/node/app/package.json ./package.json
COPY --from=builder /home/node/app/.env.local ./.env.local

CMD ["npm", "run", "start"]
