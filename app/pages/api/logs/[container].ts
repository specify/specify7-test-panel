import type { NextApiRequest, NextApiResponse } from 'next';
import { getContainerLogs } from '../../../lib/logs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { container } = req.query;
  const containerNamePattern = /^[a-zA-Z0-9_-]+$/;
  if (typeof container !== 'string' || !container || !containerNamePattern.test(container)) {
    res.status(400).send('Missing or invalid container name. It must only contain alphanumeric characters, dashes, or underscores.');
    return;
  }
  try {
    const logs = await getContainerLogs(container);
    // Let Next.js handle all headers automatically - no explicit Content-Type setting
    res.status(200).send(logs);
  } catch (e: any) {
    res.status(500).send(e?.message ?? 'Failed to fetch logs');
  }
}