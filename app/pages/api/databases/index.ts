import type { NextApiRequest, NextApiResponse } from 'next';

import {getUser, noCaching} from '../../../lib/apiUtils';
import { connectToDatabase } from '../../../lib/database';
import type { IR, RA } from '../../../lib/typescriptCommonTypes';

const databasesToExclude = new Set([
  'information_schema',
  'performance_schema',
  'mysql',
  'sys',
]);

// Get databases and schema versions
export const getDatabases = async (): Promise<IR<string | null>> =>
  connectToDatabase().then(async (connection) =>
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
      .then(async (databases) =>
        Promise.all(
          databases.map(async (database) =>
            connection
              .execute({
                sql: `SELECT AppVersion
                  FROM ${database}.spversion
                  LIMIT 1`,
                rowsAsArray: true,
              })
              .then(
                ([rows]) =>
                  (rows as unknown as Readonly<readonly [Readonly<string>]>)[0][0]
              )
              .catch((error) => {
                console.error(error);
                return null;
              })
              .then((version) => [database, version])
          )
        )
      )
      .then(Object.fromEntries)
  );

export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(request, res);
  if (typeof user === 'undefined') return;

  await getDatabases()
    .then((databases) =>
      noCaching(res).status(200).send({
        data: databases,
      })
    )
    .catch((error) => {
      console.error(error);
      res.status(500).send({ error: error.toString() });
    });
}
