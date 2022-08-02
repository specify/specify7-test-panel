import type {Fields, File, Files} from 'formidable';
import { IncomingForm } from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';

import { getUser, run } from '../../../lib/apiUtils';
import { connectToDatabase } from '../../../lib/database';

// First we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const testuserPassword = 'EC62DEF08F5E4FD556DAA86AEC5F3FB0390EF8A862A41ECA';

export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUser(request, res);
  if (typeof user === 'undefined') return;

  const connection = await connectToDatabase();

  const data = (await new Promise<{
        readonly fields: Fields;
        readonly files: Files;
      }
    | string>((resolve, reject) => {
    const form = new IncomingForm({
      // 4 GB. If changing this value, don't forget to change the panel.conf too
      maxFileSize: 4 * 1024 * 1024 * 1024,
    });

    form.parse(request, (error, fields, files) => {
      if (error) reject(error.toString());
      else resolve({ fields, files });
    });
  }));

  if (typeof data === 'string') return res.status(400).json({ error: data });

  const databaseName = data.fields.databaseName as string | undefined;

  if (!databaseName)
    return res.status(400).json({ error: 'Database name is required' });

  if (databaseName.match(/^\w+$/) === null)
    return res.status(400).json({ error: 'Database name is invalid' });

  const file = data.files.file as File | undefined;

  if (typeof file === 'undefined' || file.newFilename === null)
    return res.status(400).json({ error: 'No file is attached' });

  // eslint-disable-next-line functional/prefer-readonly-type
  const destructors: (() => Promise<void>)[] = [];
  destructors.push(async () => fs.promises.unlink(file.filepath));

  try {
    const nameParts = file.newFilename.split('.').slice(1);
    let filePath: string;
    const isTarArchive = nameParts.includes('tar') || nameParts.includes('tgz');
    const isZipArchive = nameParts.at(-1) === 'zip';
    if (isTarArchive || isZipArchive) {
      const listOfFiles = await run(
        `${isTarArchive ? 'tar t -f' : 'unzip -l'} ${file.filepath}`
      )
        .then((output) => output.trim().split('\n'))
        .then((listOfFiles) =>
          isTarArchive
            ? listOfFiles
            : listOfFiles
                .slice(3, -2)
                .map((line) => line.split('   ').at(-1)!)
        );
      const databaseFilePath = listOfFiles.find((filePath) =>
        filePath.endsWith('.sql')
      );
      if (!databaseFilePath)
        throw new Error('Unable to find a database dump in the archive');

      const directoryName = `${file.filepath}_dir`;
      await fs.promises.mkdir(directoryName);

      const databaseFileName = isTarArchive
        ? path.basename(databaseFilePath)
        : 'database.sql';
      filePath = path.join(directoryName, databaseFileName);

      const depth = databaseFilePath.split('/').length - 1;
      await run(
        isTarArchive
          ? `tar xf ${file.filepath} --strip-components=${depth} \
              -C ${directoryName} ${databaseFilePath}`
          : `unzip -p ${file.filepath} ${databaseFilePath} > ${filePath}`
      );

      destructors.push(
        async () => fs.promises.unlink(filePath),
        async () => fs.promises.rmdir(directoryName)
      );
    } else filePath = file.filepath;

    await run(`sed -i -e 's/^CREATE DATABASE.*$//g' ${filePath}`);
    await run(`sed -i -e 's/^USE .*$//g' ${filePath}`);
    await connection.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await connection.execute(`CREATE DATABASE \`${databaseName}\``);
    await run(
      [
        `mysql -u${process.env.MYSQL_USERNAME} `,
        `-p${process.env.MYSQL_PASSWORD} `,
        `-h${process.env.MYSQL_HOST} `,
        `--database "${databaseName}" < ${filePath}`,
      ].join('')
    );
    await connection.execute(
      `UPDATE \`${databaseName}\`.specifyuser
       SET Password=?;`,
      [testuserPassword]
    );
    res.writeHead(302, {
      Location: '/databases/',
    });
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  } finally {
    for await (const destructor of destructors) destructor();
  }
}
