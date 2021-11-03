# Based on:
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# Install dependencies
FROM node:16.13.0-alpine3.14 AS deps

# RUN apk add --no-cache libc6-compat
WORKDIR /home/node
COPY package*.json ./
RUN npm ci


# Build source code
FROM node:16.13.0-alpine3.14 AS builder

WORKDIR /home/node
COPY . .
COPY --from=deps /home/node/node_modules ./node_modules
RUN npm run build


# Common for production & development deployments
FROM node:16.13.0-alpine3.14 AS runner-common
LABEL maintainer="Specify Collections Consortium <github.com/specify>"

WORKDIR /home/node

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

RUN apk add --no-cache mariadb-client


# Development image
FROM runner-common AS dev-runner

WORKDIR /home/node
COPY . .

VOLUME /home/node
ENV NODE_ENV development
USER nextjs
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]


# Production image, copy all the files and run next
FROM runner-common AS runner

WORKDIR /home/node

COPY --from=builder /home/node/next.config.js ./
COPY --from=builder /home/node/public ./public
COPY --from=builder --chown=nextjs:nodejs /home/node/.next ./.next
COPY --from=builder /home/node/node_modules ./node_modules
COPY --from=builder /home/node/package.json ./package.json
COPY --from=builder /home/node/.env.local ./.env.local

VOLUME /home/node/state
ENV NODE_ENV production
USER nextjs
CMD ["npm", "run", "start"]
