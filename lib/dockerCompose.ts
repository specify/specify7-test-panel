import { ActiveDeployment } from './deployment';
import { RA } from './typescriptCommonTypes';

// FIXME: replace all instances of {{  }}
export const createDockerConfig = (
  deployments: RA<ActiveDeployment>
): string => `
version: '3.7'
services:
  
${deployments
  .map(
    (deployment) => `
  ${deployment.hostname}:
    image: specifyconsortium/specify7-service:${deployment.branch}
    init: true
    volumes:
      - "specify${deployment.schemaVersion}:/opt/Specify:ro"
      - "${deployment.hostname}-static-files:/volumes/static-files"
    environment:
      - DATABASE_NAME=${deployment.database}
      - DATABASE_HOST={{db_host}}
      - MASTER_NAME={{db_user}}
      - MASTER_PASSWORD={{db_pass}}
      - SECRET_KEY="change this to some unique random string"
      - REPORT_RUNNER_HOST=report-runner
      - REPORT_RUNNER_PORT=8080
      - CELERY_BROKER_URL=redis://redis/0
      - CELERY_RESULT_BACKEND=redis://redis/1
      - CELERY_TASK_QUEUE=${deployment.hostname}
      - SP7_DEBUG=true
      - LOG_LEVEL=DEBUG

  ${deployment.hostname}-worker:
    image: specifyconsortium/specify7-service:${deployment.branch}
    command: ve/bin/celery -A specifyweb worker -l INFO --concurrency=1 -Q ${deployment.hostname}
    init: true
    volumes:
      - "specify${deployment.schemaVersion}:/opt/Specify:ro"
    environment:
      - LC_ALL=C.UTF-8
      - LANG=C.UTF-8
      - DATABASE_NAME=${deployment.database}
      - DATABASE_HOST={{db_host}}
      - MASTER_NAME={{db_user}}
      - MASTER_PASSWORD={{db_pass}}
      - SECRET_KEY="change this to some unique random string"
      - REPORT_RUNNER_HOST=report-runner
      - REPORT_RUNNER_PORT=8080
      - CELERY_BROKER_URL=redis://redis/0
      - CELERY_RESULT_BACKEND=redis://redis/1
      - CELERY_TASK_QUEUE=${deployment.hostname}
      - SP7_DEBUG=true
      - LOG_LEVEL=DEBUG`
  )
  .join('\n\n')}

${Array.from(new Set(deployments.map(({ schemaVersion }) => schemaVersion)))
  .map(
    (specifyVersion) => `
  specify${specifyVersion}:
    image: specifyconsortium/specify6-service:${specifyVersion}
    volumes:
      - "specify${specifyVersion}:/volumes/Specify"`
  )
  .join('\n\n')}

  nginx:
    environment:
      - FORCE_RECREATE={{nginx_recreate}}
    volumes:
    ${deployments
      .map(
        ({ hostname }) => `
      - "${hostname}-static-files:/volumes/${hostname}-static-files:ro"`
      )
      .join('')}
    ${Array.from(new Set(deployments.map(({ schemaVersion }) => schemaVersion)))
      .map(
        (specifyVersion) => `
      - "specify${specifyVersion}:/volumes/specify${specifyVersion}:ro"`
      )
      .join('')}

volumes:
${deployments
  .map(
    ({ hostname }) => `
  ${hostname}-static-files:`
  )
  .join('')}
    ${Array.from(new Set(deployments.map(({ schemaVersion }) => schemaVersion)))
      .map(
        (specifyVersion) => `
  specify${specifyVersion}:`
      )
      .join('')}`;
