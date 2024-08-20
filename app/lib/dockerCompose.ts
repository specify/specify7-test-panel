import type { ActiveDeployment, Deployment } from './deployment';
import type { RA } from './typescriptCommonTypes';

// As per https://github.com/specify/specify7/blob/e52a2c09d41aa65f623f2bd73126dd594f5d9522/.github/workflows/docker.yml#L30
export const branchToTag = (branch: string) => branch.replaceAll(/\\+/g, '-');

const resolveVersion = (deployment: Deployment) =>
  typeof deployment.digest === 'string'
    ? `@${deployment.digest}`
    : `:${branchToTag(deployment.branch)}`;

export const createDockerConfig = (
  deployments: RA<ActiveDeployment>,
  // This is used just to make docker Nginx container if config changed
  nginxConfigHash: number
): string => `
services:

${
  deployments.length === 0
    ? `
  mariadb:
    restart: unless-stopped`
    : ''
}
${deployments
  .map(
    (deployment) => `
  ${deployment.hostname}:
    image: specifyconsortium/specify7-service${resolveVersion(deployment)}
    init: true
    restart: unless-stopped
    networks:
      - database
      - nginx
      - redis
    volumes:
      - "specify${deployment.schemaVersion}:/opt/Specify:ro"
      - "${deployment.hostname}-static-files:/volumes/static-files"
    environment:
      - DATABASE_NAME=${deployment.database}
      - DATABASE_HOST=${process.env.MYSQL_HOST}
      - MASTER_NAME=${process.env.MYSQL_USERNAME}
      - MASTER_PASSWORD=${process.env.MYSQL_PASSWORD}
      - SECRET_KEY=${process.env.SECRET_KEY}
      - ASSET_SERVER_URL=${process.env.ASSET_SERVER_URL}
      - ASSET_SERVER_KEY=${process.env.ASSET_SERVER_KEY}
      - ASSET_SERVER_COLLECTION=${process.env.ASSET_SERVER_COLLECTION}
      - REPORT_RUNNER_HOST=${process.env.REPORT_RUNNER_HOST}
      - REPORT_RUNNER_PORT=8080
      - CELERY_BROKER_URL=redis://redis/0
      - CELERY_RESULT_BACKEND=redis://redis/1
      - CELERY_TASK_QUEUE=${deployment.hostname}
      - SP7_DEBUG=true
      - LOG_LEVEL=DEBUG

  ${deployment.hostname}-worker:
    image: specifyconsortium/specify7-service${resolveVersion(deployment)}
    command: ve/bin/celery -A specifyweb worker -l INFO --concurrency=1 -Q ${
      deployment.hostname
    }
    init: true
    restart: unless-stopped
    volumes:
      - "specify${deployment.schemaVersion}:/opt/Specify:ro"
    networks:
      - redis
      - database
    environment:
      - LC_ALL=C.UTF-8
      - LANG=C.UTF-8
      - DATABASE_NAME=${deployment.database}
      - DATABASE_HOST=${process.env.MYSQL_HOST}
      - MASTER_NAME=${process.env.MYSQL_USERNAME}
      - MASTER_PASSWORD=${process.env.MYSQL_PASSWORD}
      - SECRET_KEY=${process.env.SECRET_KEY}
      - ASSET_SERVER_URL=${process.env.ASSET_SERVER_URL}
      - ASSET_SERVER_KEY=${process.env.ASSET_SERVER_KEY}
      - ASSET_SERVER_COLLECTION=${process.env.ASSET_SERVER_COLLECTION}
      - REPORT_RUNNER_HOST=${process.env.REPORT_RUNNER_HOST}
      - REPORT_RUNNER_PORT=8080
      - CELERY_BROKER_URL=redis://redis/0
      - CELERY_RESULT_BACKEND=redis://redis/1
      - CELERY_TASK_QUEUE=${deployment.hostname}
      - SP7_DEBUG=true
      - LOG_LEVEL=DEBUG`
  )
  .join('\n\n')}

${Array.from(
  new Set(deployments.map(({ schemaVersion }) => schemaVersion)),
  (specifyVersion) => `
  specify${specifyVersion}:
    image: specifyconsortium/specify6-service:${specifyVersion}
    volumes:
      - "specify${specifyVersion}:/volumes/Specify"`
).join('\n\n')}

  nginx:
    environment:
      - CONFIG_HASH=${nginxConfigHash}
    volumes:
    ${deployments
      .map(
        ({ hostname }) => `
      - "${hostname}-static-files:/volumes/${hostname}-static-files:ro"`
      )
      .join('')}
    ${Array.from(
      new Set(deployments.map(({ schemaVersion }) => schemaVersion)),
      (specifyVersion) => `
      - "specify${specifyVersion}:/volumes/specify${specifyVersion}:ro"`
    ).join('')}

volumes:
${deployments
  .map(
    ({ hostname }) => `
  ${hostname}-static-files:`
  )
  .join('')}
    ${Array.from(
      new Set(deployments.map(({ schemaVersion }) => schemaVersion)),
      (specifyVersion) => `
  specify${specifyVersion}:`
    ).join('')}`;
