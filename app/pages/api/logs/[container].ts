import type { NextApiRequest, NextApiResponse } from 'next';
import { getContainerLogs } from '../../../lib/logs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { container } = req.query;
  if (typeof container !== 'string' || !container) {
    res.status(400).send('Missing or invalid container name');
    return;
  }
  try {
    const logs = await getContainerLogs(container);
    res.status(200).send(logs);
  } catch (e: any) {
    res.status(500).send(e?.message ?? 'Failed to fetch logs');
  }
}