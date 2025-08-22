import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'node:child_process';

import { getUser } from '../../../../lib/apiUtils';
import { connectToDatabase } from '../../../../lib/database';

// First we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(request, res);
  if (typeof user === 'undefined') return;

  await connectToDatabase();

  const databaseName = request.query.name;
  const sanitizedFilename = String(databaseName).replace(/[^\w.-]/g, '_');

  try {
    const result = await spawn(
      'mariadb-dump',
      [
        `--user=${process.env.MYSQL_USERNAME}`,
        `--password=${process.env.MYSQL_PASSWORD}`,
        `--host=${process.env.MYSQL_HOST}`,
        `--databases ${databaseName}`,
        '--no-create-db',
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      }
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${sanitizedFilename}.sql"`
    );

    result.stdout.pipe(res);
    result.stderr.on('data', (error) => {
      throw new Error(error);
    });
    await new Promise((resolve) => result.stdout.on('exit', resolve));
  } catch (error) {
    res.status(500).json({
      error: (error as object).toString(),
    });
  }
}
