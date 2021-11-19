import { NextApiRequest, NextApiResponse } from 'next';
import { getUserInfo } from '../../lib/user';
import { getState, setState } from './state';

export default async (req: NextApiRequest, res: NextApiResponse) =>
  await setState(
    await getState(),
    await getUserInfo(process.env.GITHUB_PERSONAL_TOKEN ?? ''),
    req.headers['origin'] ?? ''
  )
    .then(() => res.status(204).send(''))
    .catch((error) => res.status(500).json({ error: error.toString() }));
