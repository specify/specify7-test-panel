import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';

import {
  nginxConfDirectory as nginxConfigDirectory,
  stateDirectory,
} from '../../../const/siteConfig';
import { fileExists, getUser, noCaching } from '../../../lib/apiUtils';
import type { ActiveDeployment, Deployment } from '../../../lib/deployment';
import {
  autoDeployPullRequests,
  formalizeState,
} from '../../../lib/deployment';
import { createDockerConfig } from '../../../lib/dockerCompose';
import { createNginxConfig } from '../../../lib/nginx';
import type { RA } from '../../../lib/typescriptCommonTypes';
import type { User } from '../../../lib/user';

const configurationFile = path.resolve(stateDirectory, 'configuration.json');
const nginxConfigurationFile = path.resolve(nginxConfigDirectory, 'nginx.conf');
const dockerConfigurationFile = path.resolve(
  stateDirectory,
  'docker-compose.yml'
);

export async function getState(): Promise<RA<ActiveDeployment>> {
  if (!(await fileExists(configurationFile)))
    await fs.promises.writeFile(configurationFile, JSON.stringify([]));

  return fs.promises
    .readFile(configurationFile)
    .then((file) => file.toString())
    .then((content) => (content.length === 0 ? [] : JSON.parse(content)));
}

// Based on https://stackoverflow.com/a/34842797/8584605
const getHash = (string: string): number =>
  string
    .split('')
    .reduce(
      (previousHash, currentValue) =>
        (previousHash << 5) - previousHash + currentValue.charCodeAt(0),
      0
    );

export async function setState(
  deployments: RA<Deployment>,
  user: User,
  origin: string,
  autoDeploy = true
): Promise<RA<ActiveDeployment>> {
  const state = await autoDeployPullRequests(
    formalizeState(deployments, await getState()),
    user,
    autoDeploy
  );

  await fs.promises.writeFile(configurationFile, JSON.stringify(state));
  const nginxConfig = createNginxConfig(state, new URL(origin).host);
  await fs.promises.writeFile(nginxConfigurationFile, nginxConfig);
  const currentDockerConfigurationFile = (
    await fs.promises.readFile(dockerConfigurationFile)
  ).toString();
  const newDockerConfigurationFile = createDockerConfig(
    state,
    getHash(nginxConfig)
  );
  if (currentDockerConfigurationFile !== newDockerConfigurationFile)
    await fs.promises.writeFile(
      dockerConfigurationFile,
      newDockerConfigurationFile
    );
  return state;
}

export default async function handler(
  request_: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(request_, res);
  if (typeof user === 'undefined') return;

  if (request_.method === 'POST') {
    const request = JSON.parse(request_.body);
    if (typeof request !== 'object')
      return void res.status(400).json({
        error: 'Invalid request body specified',
      });

    const origin = request_.headers.origin;
    if (typeof origin !== 'string')
      return void res
        .status(400)
        .json({ error: '"Origin" request header is missing' });

    const state = await setState(request, user, origin);

    noCaching(res).status(200).json({ data: state });
  } else if (request_.method === 'GET')
    await getState()
      .then((data) => noCaching(res).status(200).json({ data }))
      .catch((error) => res.status(500).json({ error: error.toString() }));
  else
    return res.status(400).json({
      error: 'Only POST and GET Methods are allowed',
    });
}
