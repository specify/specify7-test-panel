import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '../../../../lib/apiUtils';
import { connection, connectToDatabase } from '../../../../lib/database';
import { RA } from '../../../../lib/typescriptCommonTypes';

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
  const user = getUser(req, res);
  if (typeof user === 'undefined') return;

  await connectToDatabase();

  const databaseName = req.query.name as string;

  if (databaseName.match(/^\w+$/) === null)
    return res.status(400).json({ error: 'Database name is invalid' });

  connection
    .execute({
      sql: `SELECT Name FROM ${databaseName}.specifyuser`,
      rowsAsArray: true,
    })
    .then(([users]) =>
      res.status(200).send({
        data: (users as unknown as RA<RA<string>>).flat(),
      })
    )
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
