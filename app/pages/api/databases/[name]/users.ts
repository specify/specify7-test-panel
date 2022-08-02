import type { NextApiRequest, NextApiResponse } from 'next';
import {getUser, noCaching} from '../../../../lib/apiUtils';
import { connectToDatabase } from '../../../../lib/database';
import { RA } from '../../../../lib/typescriptCommonTypes';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  const connection = await connectToDatabase();

  const databaseName = req.query.name as string;

  if (databaseName.match(/^\w+$/) === null)
    return res.status(400).json({ error: 'Database name is invalid' });

  connection
    .execute(
      `SELECT SpecifyUserID, Name 
     FROM ${databaseName}.specifyuser`
    )
    .then(([users]) =>
      noCaching(res).status(200).send({
        data: Object.fromEntries(
          (
            users as unknown as RA<{
              readonly SpecifyUserID: string;
              readonly Name: string;
            }>
          ).map(Object.values)
        ),
      })
    )
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
