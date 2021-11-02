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
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  await connectToDatabase();

  const databaseName = req.query.name as string;

  if (databaseName.match(/^\w+$/) === null)
    return res.status(400).json({ error: 'Database name is invalid' });

  connection
    .execute(
      `SELECT Name, UserType
     FROM ${databaseName}.specifyuser`
    )
    .then(([users]) =>
      res.status(200).send({
        data: Object.fromEntries(
          (
            users as unknown as RA<{
              readonly Name: string;
              readonly UserType: string;
            }>
          ).map(Object.values)
        ),
      })
    )
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
