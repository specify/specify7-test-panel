import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Temporarily disable logs functionality to debug ERR_INVALID_CHAR issue
  res.status(200).send('Logs functionality temporarily disabled for debugging');
}