import { uploadQueue } from './uploadQueue';
import { run } from './apiUtils';
import { connectToDatabase } from './database';
import { resetDatabasePasswords } from './passwordUtils';
import path from 'node:path';
import fs from 'node:fs';

uploadQueue.process(async (job) => {
  const { filePath, databaseName, originalFilename } = job.data;
  job.progress(5);
  try {
    const connection = await connectToDatabase();
    job.progress(10);
    const nameParts = originalFilename.split('.').slice(1);
    let dbFilePath: string;
    const isTarArchive = nameParts.includes('tar') || nameParts.includes('tgz');
    const isZipArchive = nameParts.at(-1) === 'zip';
    if (isTarArchive || isZipArchive) {
      job.progress(20);
      const listOfFiles = await run(
        `${isTarArchive ? 'tar t -f' : 'unzip -l'} ${filePath}`
      )
        .then((output) => output.trim().split('\n'))
        .then((listOfFiles) =>
          isTarArchive
            ? listOfFiles
            : listOfFiles.slice(3, -2).map((line) => line.split('   ').at(-1)!)
        );
      const databaseFilePath = listOfFiles.find((filePath) =>
        filePath.endsWith('.sql')
      );
      if (!databaseFilePath)
        throw new Error('Unable to find a database dump in the archive');

      const directoryName = `${filePath}_dir`;
      await fs.promises.mkdir(directoryName);

      const databaseFileName = isTarArchive
        ? path.basename(databaseFilePath)
        : 'database.sql';
      dbFilePath = path.join(directoryName, databaseFileName);

      const depth = databaseFilePath.split('/').length - 1;
      await run(
        isTarArchive
          ? `tar xf ${filePath} --strip-components=${depth} \
              -C ${directoryName} ${databaseFilePath}`
          : `unzip -p ${filePath} ${databaseFilePath} > ${dbFilePath}`
      );
      job.progress(40);
    } else {
      dbFilePath = filePath;
      job.progress(20);
    }

    await run(`sed -i -e 's/^CREATE DATABASE.*$//g' ${dbFilePath}`);
    await run(`sed -i -e 's/^USE .*$//g' ${dbFilePath}`);
    await run(`sed -i -e 's/^DROP DATABASE.*$//g' ${dbFilePath}`);
    job.progress(50);
    await connection.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await connection.execute(`CREATE DATABASE \`${databaseName}\``);
    job.progress(70);
    await run(
      [
        `mariadb -u${process.env.MYSQL_USERNAME} `,
        `-p${process.env.MYSQL_PASSWORD} `,
        `-h${process.env.MYSQL_HOST} `,
        `--database "${databaseName}" < ${dbFilePath}`,
      ].join('')
    );
    job.progress(90);
    await resetDatabasePasswords(connection, databaseName);
    job.progress(100);
    return { success: true };
  } catch (error: any) {
    job.progress(100);
    return { success: false, error: error.toString() };
  }
});
