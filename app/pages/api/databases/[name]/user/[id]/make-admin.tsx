import { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '../../../../../../lib/apiUtils';
import { connection, connectToDatabase } from '../../../../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Only POST requests are allowed' });

  await connectToDatabase();

  const databaseName = req.query.name as string;

  if (databaseName.match(/^\w+$/) === null)
    return res.status(400).json({ error: 'Database name is invalid' });

  const userIdString = req.query.id as string;
  const userId = Number.parseInt(userIdString);

  if (Number.isNaN(userId))
    return res.status(400).json({ error: 'Username is invalid' });

  return connection
    .execute(
      `INSERT INTO spuserpolicy (resource, action, collection_id, specifyuser_id) VALUES (%, %, NULL, ?)`,
      [userId]
    )
    .then(() => res.status(204).send(''))
    .catch((error: Error) => res.status(500).json({ error: error.toString() }));
}
