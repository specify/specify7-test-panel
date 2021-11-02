import { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '../../../../lib/apiUtils';
import { getState, setState } from '../index';

/*
 * Update the accessedAt time for an instance when clicking the "Launch" button
 * to prevent it from getting garbage collected
 * */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  const origin = req.headers['origin'];
  if (typeof origin !== 'string')
    return res
      .status(400)
      .json({ error: '"Origin" request header is missing' });

  const state = await getState();

  const index = Number.parseInt(req.query.index as string);
  if (Number.isNaN(index) || index < 0 || index >= state.length)
    return res.status(400).json({ error: 'Invalid index' });

  await setState(
    [
      ...state.slice(0, index),
      {
        ...state[index],
        accessedAt: Date.now(),
      },
      ...state.slice(index + 1),
    ],
    user,
    origin
  );

  return res.status(204).send('');
}
