import { NextApiRequest, NextApiResponse } from 'next';
import { workingDirectory } from '../../../const/siteConfig';
import { fileExists, getUser } from '../../../lib/apiUtils';
import path from 'path';
import fs from 'fs';
import {
  autoDeployPullRequests,
  formalizeState,
} from '../../../lib/deployment';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  const fileName = path.resolve(workingDirectory, 'configuration.json');

  if (req.method === 'POST') {
    const request = JSON.parse(req.body);
    if (typeof request !== 'object')
      return res.status(400).json({
        error: 'Invalid request body specified',
      });
    const state = await autoDeployPullRequests(formalizeState(request), user);
    // FIXME: uncomment this
    // FIXME: update accessAt on click
    //await fs.promises.writeFile(fileName, JSON.stringify(state));
    res.status(200).json({ data: state });
  } else if (req.method === 'GET') {
    if (!(await fileExists(fileName)))
      await fs.promises.writeFile(fileName, JSON.stringify([]));

    await fs.promises
      .readFile(fileName)
      .then((file) => file.toString())
      .then((content) => res.status(200).json({ data: JSON.parse(content) }))
      .catch((error) => res.status(500).json({ error: error.toString() }));
  } else
    return res.status(400).json({
      error: 'Only POST and GET Methods are allowed',
    });
}
