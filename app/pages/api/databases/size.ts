import type { NextApiRequest, NextApiResponse } from 'next';

import { getUser, noCaching } from '../../../lib/apiUtils';
import { connectToDatabase } from '../../../lib/database';
import type { IR, RA } from '../../../lib/typescriptCommonTypes';
import { databasesToExclude } from './index';

/**
 * Get database sizes in MB
 */
const getDatabaseSizes = async (): Promise<IR<number>> =>
  connectToDatabase().then(async (connection) =>
    connection
      .execute({
        sql: `
          SELECT table_schema "name",
                 ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) "size"
          FROM information_schema.tables
          GROUP BY table_schema
          ORDER BY size;
        `,
        rowsAsArray: false,
      })
      .then(([rows]) =>
        Object.fromEntries(
          (
            rows as unknown as RA<{
              readonly name: string;
              readonly size: string;
            }>
          )
            .filter(({ name }) => !databasesToExclude.has(name))
            .map(({ name, size }) => [name, Number.parseInt(size)])
        )
      )
  );

export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(request, res);
  if (typeof user === 'undefined') return;

  await getDatabaseSizes()
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
