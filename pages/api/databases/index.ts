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

export const getDatabases = async (): Promise<RA<string>> =>
  connectToDatabase().then(() =>
    connection
      .execute({
        sql: 'SHOW DATABASES',
        rowsAsArray: true,
      })
      .then(([rows]) =>
        (rows as unknown as RA<RA<string>>)
          .flat()
          .filter((database) => !databasesToExclude.has(database))
      )
  );

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  await getDatabases()
    .then((databases) =>
      res.status(200).send({
        data: databases,
      })
    )
    .catch((error) => {
      console.error(error);
      res.status(500).send({ error: error.toString() });
    });
}
