import { NextApiRequest, NextApiResponse } from 'next';
import { workingDirectory } from '../../const/siteConfig';
import { fileExists, getUser } from '../../lib/apiUtils';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUser(req, res);
  if (typeof user === 'undefined') return;

  const fileName = path.resolve(workingDirectory, 'configuration.json');

  if (req.method === 'PUT') {
    const request = JSON.parse(req.body);
    if (typeof request !== 'object')
      return res.status(400).json({
        error: 'Invalid request body specified',
      });
    await fs.promises.writeFile(fileName, JSON.stringify(request));
  } else if (req.method === 'GET') {
    if (!(await fileExists(fileName)))
      await fs.promises.writeFile(fileName, JSON.stringify([]));

    await fs.promises
      .readFile(fileName)
      .then((file) => file.toString())
      .then((content) => res.status(200).json(content))
      .catch((error) => res.status(500).json({ error: error.toString() }));
  } else
    return res.status(400).json({
      error: 'Only PUT and GET Methods are allowed',
    });
}
