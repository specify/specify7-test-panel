import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '../../../../lib/apiUtils';
import { connection, connectToDatabase } from '../../../../lib/database';

// first we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  await connectToDatabase();

  const databaseName = req.query.name as string;

  if (databaseName.match(/^\w+$/) === null)
    return res.status(400).json({ error: 'Database name is invalid' });

  connection
    .execute(`DROP DATABASE \`${databaseName}\``)
    .then(() => {
      res.writeHead(302, {
        Location: '/databases/',
      });
      res.end();
    })
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
