import type { NextApiRequest, NextApiResponse } from 'next';

import { getUser } from '../../../../../../lib/apiUtils';
import { connectToDatabase } from '../../../../../../lib/database';

export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(request, res);
  if (typeof user === 'undefined') return;

  if (request.method !== 'POST')
    return void res.status(405).json({ error: 'Only POST requests are allowed' });

  const connection = await connectToDatabase();

  const databaseName = request.query.name as string;

  if (databaseName.match(/^\w+$/) === null)
    return void res.status(400).json({ error: 'Database name is invalid' });

  const userIdString = request.query.id as string;
  const userId = Number.parseInt(userIdString);

  if (Number.isNaN(userId))
    return res.status(400).json({ error: 'Username is invalid' });

  return connection
    .execute(
      `INSERT INTO ${databaseName}.spuserpolicy (resource, action, collection_id, specifyuser_id) VALUES ("%", "%", NULL, ?)`,
      [userId]
    )
    .then(() => res.status(204).send(''))
    .catch((error: Error) => res.status(500).json({ error: error.toString() }));
}
