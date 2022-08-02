import type { NextApiRequest, NextApiResponse } from 'next';

import { getUser } from '../../lib/apiUtils';

export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(request, res);
  if (typeof user !== 'undefined') res.status(200).json({ data: user });
}
