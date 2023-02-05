# Based on:
# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# Install dependencies
FROM node:19-alpine3.16 AS deps

USER node
WORKDIR /home/node
RUN mkdir app # So it is owned by node
COPY app/package*.json app/
WORKDIR /home/node/app
RUN npm ci


# Build source code
FROM deps AS builder

USER node
WORKDIR /home/node/app
COPY --chown=node:node app .
RUN npm run build


# Common for production & development deployments
FROM node:19-alpine3.16 AS runner-common
LABEL maintainer="Specify Collections Consortium <github.com/specify>"

RUN apk add --no-cache mariadb-client
USER node
WORKDIR /home/node
RUN mkdir state
COPY --chown=node:node state state
RUN mkdir nginx.conf.d


# Development image
FROM runner-common AS dev-runner

USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app
ENV NODE_ENV development

COPY docker-entrypoint.sh ../
ENTRYPOINT ["../docker-entrypoint.sh"]


# Production image, copy all files and run next
FROM runner-common AS runner

USER node
WORKDIR /home/node/app
ENV NODE_ENV production

COPY --from=builder /home/node/app/next.config.js ./
COPY --from=builder /home/node/app/public ./public
COPY --from=builder /home/node/app/.next ./.next
COPY --from=builder /home/node/app/node_modules ./node_modules
COPY --from=builder /home/node/app/package.json ./package.json
COPY --from=builder /home/node/app/.env.local ./.env.local

CMD ["npm", "run", "start"]
