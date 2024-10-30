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
  console.log('Received request to clone database.');

  const user = await getUser(request, res);
  if (typeof user === 'undefined') return;

  const connection = await connectToDatabase();

  // Define the existing database name to clone
  const existingDatabaseName = request.query.name as string | undefined;

  if (!existingDatabaseName) {
    console.error('Existing database name is required.');
    return res.status(400).json({ error: 'Existing database name is required' });
  }

  // Validate that the existing database name is valid
  if (existingDatabaseName.match(/^\w+$/) === null) {
    console.error('Existing database name is invalid.');
    return res.status(400).json({ error: 'Existing database name is invalid' });
  }

  try {
    // Generate a new database name with timestamp
    console.log(`Cloning database: ${existingDatabaseName}`);

    const now = new Date();
    const timestamp = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}`;    
    const newDatabaseName = `${existingDatabaseName}_${timestamp}`;

    console.log(`New database name will be: ${newDatabaseName}`);

    // Create the new database
    await connection.execute(`DROP DATABASE IF EXISTS \`${newDatabaseName}\``);
    await connection.execute(`CREATE DATABASE \`${newDatabaseName}\``);
    console.log(`Database ${newDatabaseName} created successfully.`);

    // Clone the existing database into the new database
    const cloneChild = spawn(
      'mysqldump',
      [
        `-u${process.env.MYSQL_USERNAME}`,
        `-p${process.env.MYSQL_PASSWORD}`,
        `-h${process.env.MYSQL_HOST}`,
        '--databases',
        existingDatabaseName,
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
    cloneChild.stdout.pipe(importChild.stdin);
    cloneChild.stderr.on('data', (error) => {
      console.error('Error cloning database:', error.toString());
      throw new Error(`Failed to clone database from ${existingDatabaseName} to ${newDatabaseName}`);
    });

    importChild.stderr.on('data', (error) => {
      console.error('Error importing database:', error.toString());
    });

    await new Promise((resolve, reject) => {
      importChild.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Failed to import data into database: ${newDatabaseName}`);
          return reject(new Error(`Failed to import data into database: ${newDatabaseName}`));
        }
        console.log(`Data imported successfully into database: ${newDatabaseName}`);
        resolve(null);
      });
    });

    res.status(200).json({
      message: `Database cloned successfully: ${newDatabaseName}`,
    });
  } catch (error: any) {
    console.error('Error during cloning process:', error.toString());
    res.status(500).json({ error: error.toString() });
  }
}
