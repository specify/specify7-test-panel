import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser, noCaching } from '../../../../lib/apiUtils';
import { cloneQueue } from '../../../../lib/queue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  if (req.method === 'GET') {
    const { jobId } = req.query;
    if (typeof jobId !== 'string' || !jobId.trim()) {
      res.status(400).send({ error: 'Missing job ID' });
      return;
    }
    const job = await cloneQueue.getJob(jobId);
    if (!job) {
      res.status(404).send({ error: 'No clone in progress or not found' });
      return;
    }
    const progress = job.progress();
    const result = await job.finished().catch(() => null);
    noCaching(res).status(200).json({
      total: result?.total || 0,
      current: result?.current || 0,
      done: !!result?.done,
      error: result?.error,
      progress,
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const { name } = req.query;
  const { newName } = req.body;

  if (typeof name !== 'string' || typeof newName !== 'string' || !newName.trim()) {
    res.status(400).send({ error: 'Invalid database name(s)' });
    return;
  }

  try {
    // Enqueue clone job
    const job = await cloneQueue.add({ sourceDb: name, targetDb: newName });
    noCaching(res).status(200).send({ jobId: job.id });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error?.toString() });
  }
}
