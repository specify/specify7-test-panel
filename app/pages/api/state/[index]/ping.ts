import type { NextApiRequest, NextApiResponse } from 'next';

import { getUser } from '../../../../lib/apiUtils';
import { getState, setState } from '../index';
import { f } from '../../../../lib/functools';

/**
 * Update the accessedAt time for an instance when clicking the "Launch" button
 * to prevent it from getting garbage collected
 */
export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const user = await getUser(request, res);
  if (typeof user === 'undefined')
    return res.status(403).json({ error: 'User not authenticated' });

  const origin = request.headers.origin;
  if (typeof origin !== 'string')
    return res
      .status(400)
      .json({ error: '"Origin" request header is missing' });

  const state = await getState();

  const index = f.parseInt(request.query.index as string);
  if (index === undefined || index < 0 || index >= state.length)
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
    origin,
    false
  );

  res.status(204).send('');
}
