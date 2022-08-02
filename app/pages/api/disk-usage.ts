import checkDistUsage from 'check-disk-space';
import { NextApiRequest, NextApiResponse } from 'next';
import {getUser, noCaching} from '../../lib/apiUtils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  return checkDistUsage('/')
    .then((data) =>
      typeof data === 'object' ? noCaching(res).status(200).json({ data }) : undefined
    )
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
