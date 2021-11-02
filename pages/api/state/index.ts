import { NextApiRequest, NextApiResponse } from 'next';
import { workingDirectory } from '../../../const/siteConfig';
import { fileExists, getUser } from '../../../lib/apiUtils';
import path from 'path';
import fs from 'fs';
import {
  ActiveDeployment,
  autoDeployPullRequests,
  Deployment,
  formalizeState,
} from '../../../lib/deployment';
import { createDockerConfig } from '../../../lib/dockerCompose';
import { createNginxConfig } from '../../../lib/nginx';
import { RA } from '../../../lib/typescriptCommonTypes';
import { User } from '../../../lib/user';

const configurationFile = path.resolve(workingDirectory, 'configuration.json');
const nginxConfigurationFile = path.resolve(workingDirectory, 'nginx.conf');
const dockerConfigurationFile = path.resolve(
  workingDirectory,
  'docker-compose.override.yml'
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
      (prevHash, currVal) => (prevHash << 5) - prevHash + currVal.charCodeAt(0),
      0
    );

export async function setState(
  deployments: RA<Deployment>,
  user: User,
  origin: string
): Promise<RA<ActiveDeployment>> {
  const state = await autoDeployPullRequests(
    formalizeState(deployments, await getState()),
    user
  );

  await fs.promises.writeFile(configurationFile, JSON.stringify(state));
  const nginxConfig = createNginxConfig(state, new URL(origin).host);
  await fs.promises.writeFile(nginxConfigurationFile, nginxConfig);
  await fs.promises.writeFile(
    dockerConfigurationFile,
    createDockerConfig(state, getHash(nginxConfig))
  );
  return state;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  if (req.method === 'POST') {
    const request = JSON.parse(req.body);
    if (typeof request !== 'object')
      return res.status(400).json({
        error: 'Invalid request body specified',
      });

    const origin = req.headers['origin'];
    if (typeof origin !== 'string')
      return res
        .status(400)
        .json({ error: '"Origin" request header is missing' });

    const state = await setState(request, user, origin);

    res.status(200).json({ data: state });
  } else if (req.method === 'GET')
    getState()
      .then((data) => res.status(200).json({ data }))
      .catch((error) => res.status(500).json({ error: error.toString() }));
  else
    return res.status(400).json({
      error: 'Only POST and GET Methods are allowed',
    });
}
