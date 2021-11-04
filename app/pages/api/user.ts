import { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '../../lib/apiUtils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user !== 'undefined') res.status(200).json({ data: user });
}
