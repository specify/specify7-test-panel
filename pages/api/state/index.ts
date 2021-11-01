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
import { RA } from '../../../lib/typescriptCommonTypes';
import { User } from '../../../lib/user';

const fileName = path.resolve(workingDirectory, 'configuration.json');

export async function getState(): Promise<RA<ActiveDeployment>> {
  if (!(await fileExists(fileName)))
    await fs.promises.writeFile(fileName, JSON.stringify([]));

  return fs.promises
    .readFile(fileName)
    .then((file) => JSON.parse(file.toString()));
}

export async function setState(
  deployments: RA<Deployment>,
  user: User
): Promise<RA<ActiveDeployment>> {
  const state = await autoDeployPullRequests(
    formalizeState(deployments, await getState()),
    user
  );
  await fs.promises.writeFile(fileName, JSON.stringify(state));
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
    const state = await setState(request, user);
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
