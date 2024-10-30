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

  const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '_').split('.')[0];
  const newDatabaseName = `${databaseName}_${timestamp}`;

  try {
    // Create the new database
    const createDatabaseChild = spawn(
      'mysql',
      [
        `-u${process.env.MYSQL_USERNAME}`,
        `-p${process.env.MYSQL_PASSWORD}`,
        `-h${process.env.MYSQL_HOST}`,
        '-e',
        `CREATE DATABASE ${newDatabaseName};`,
      ],
      {
        stdio: 'inherit',
        shell: true,
      }
    );

    await new Promise((resolve, reject) => {
        createDatabaseChild.on('exit', (code) => {
          if (code !== 0) {
            return reject(new Error(`Failed to create database: ${newDatabaseName}`));
          }
          resolve(null);
        });
      });

// Clone the current database into the new database
const cloneDatabaseChild = spawn(
    'mysqldump',
    [
      `-u${process.env.MYSQL_USERNAME}`,
      `-p${process.env.MYSQL_PASSWORD}`,
      `-h${process.env.MYSQL_HOST}`,
      '--databases',
      databaseName,
      '--no-create-db',
    ],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    }
  );

  const importChild = spawn(
    'mysql',
    [
      `-u${process.env.MYSQL_USERNAME}`,
      `-p${process.env.MYSQL_PASSWORD}`,
      `-h${process.env.MYSQL_HOST}`,
      newDatabaseName,
    ],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    }
  );

  // Pipe the dump output to the new database
  cloneDatabaseChild.stdout.pipe(importChild.stdin);
  cloneDatabaseChild.stderr.on('data', (error) => {
    throw new Error(error);
  });

  await new Promise((resolve, reject) => {
    importChild.on('exit', (code) => {
      if (code !== 0) {
        return reject(new Error(`Failed to import data into database: ${newDatabaseName}`));
      }
      resolve(null);
    });
  });

  res.status(200).json({
    message: `Database cloned successfully: ${newDatabaseName}`,
  });
} catch (error) {
  res.status(500).json({
    error: (error as Error).message,
  });
}
}