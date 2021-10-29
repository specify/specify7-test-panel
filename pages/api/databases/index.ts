import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '../../../lib/apiUtils';
import { connection, connectToDatabase } from '../../../lib/database';
import type { RA } from '../../../lib/typescriptCommonTypes';

const databasesToExclude = new Set([
  'information_schema',
  'performance_schema',
  'mysql',
  'sys',
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUser(req, res);
  if (typeof user === 'undefined') return;

  await connectToDatabase();

  await connection
    .execute({
      sql: 'SHOW DATABASES',
      rowsAsArray: true,
    })
    .then(([rows]) =>
      res.status(200).send({
        data: (rows as unknown as RA<RA<string>>)
          .flat()
          .filter((database) => !databasesToExclude.has(database)),
      })
    )
    .catch((error) => {
      console.error(error);
      res.status(500).send({ error: error.toString() });
    });
}
