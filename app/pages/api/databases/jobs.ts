import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadQueue } from '../../../lib/uploadQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List active and waiting jobs
    const activeJobs = await uploadQueue.getActive();
    const waitingJobs = await uploadQueue.getWaiting();
    const jobs = [...activeJobs, ...waitingJobs].map(job => ({
      id: job.id,
      progress: job.progress(),
      data: job.data,
      state: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : 'active',
    }));
    res.json({ jobs });
  } else if (req.method === 'POST') {
    // Cancel a job
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: 'Missing jobId' });
    const job = await uploadQueue.getJob(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await job.remove();
    res.json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
