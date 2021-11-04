import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser, run } from '../../../lib/apiUtils';
import { IncomingForm, Fields, Files, File } from 'formidable';
import fs from 'fs';
import { connection, connectToDatabase } from '../../../lib/database';

// first we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const testuserPassword = 'EC62DEF08F5E4FD556DAA86AEC5F3FB0390EF8A862A41ECA';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  await connectToDatabase();

  const data = (await new Promise((resolve, reject) => {
    const form = new IncomingForm({
      // 4 GB
      maxFileSize: 4 * 1024 * 1024 * 1024,
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err.toString());
      resolve({ fields, files });
    });
  })) as
    | {
        readonly fields: Fields;
        readonly files: Files;
      }
    | string;

  if (typeof data === 'string') return res.status(400).json({ error: data });

  const databaseName = data.fields.databaseName as string | undefined;

  if (!databaseName)
    return res.status(400).json({ error: 'Database name is required' });

  if (databaseName.match(/^\w+$/) === null)
    return res.status(400).json({ error: 'Database name is invalid' });

  const filePath = (data.files.file as File | undefined)?.path;

  if (typeof filePath === 'undefined')
    return res.status(400).json({ error: 'No file is attached' });

  await run(`sed -i -e 's/^CREATE DATABASE.*$//g' ${filePath}`)
    .then(() => run(`sed -i -e 's/^USE .*$//g' ${filePath}`))
    .then(() =>
      connection.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``)
    )
    .then(() => connection.execute(`CREATE DATABASE \`${databaseName}\``))
    .then(() =>
      run(
        [
          `mysql -u${process.env.MYSQL_USERNAME} `,
          `-p${process.env.MYSQL_PASSWORD} `,
          `-h${process.env.MYSQL_HOST} `,
          `--database "${databaseName}" < ${filePath}`,
        ].join('')
      )
    )
    .then(() =>
      connection.execute(
        `UPDATE \`${databaseName}\`.specifyuser SET Password=?;`,
        [testuserPassword]
      )
    )
    .then(() => fs.promises.unlink(filePath))
    .then(() => {
      res.writeHead(302, {
        Location: '/databases/',
      });
      res.end();
    })
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
