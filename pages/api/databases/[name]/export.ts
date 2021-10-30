import { spawn } from 'child_process';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser } from '../../../../lib/apiUtils';
import { connectToDatabase } from '../../../../lib/database';

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

  const databaseName = req.query.name;

  try {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', `private, max-age=5000`);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${databaseName}.sql`
    );

    const child = spawn(
      'mysqldump',
      [
        `-u${process.env.MYSQL_USERNAME}`,
        `-p${process.env.MYSQL_PASSWORD}`,
        `-h${process.env.MYSQL_HOST}`,
        `--database ${databaseName}`,
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      }
    );

    child.stdout.pipe(res);
    child.stderr.on('data', (error) => {
      throw new Error(error);
    });
    await new Promise((resolve) => child.stdout.on('exit', resolve));
  } catch (error) {
    res.status(500).json({
      error: (error as object).toString(),
    });
  }
}
