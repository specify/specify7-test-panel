import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadQueue } from '../../../lib/uploadQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;
  if (!jobId) return res.status(400).json({ error: 'Missing job ID' });
  const job = await uploadQueue.getJob(jobId as string);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const state = await job.getState();
  const progress = job.progress();
  res.json({ state, progress });
}
