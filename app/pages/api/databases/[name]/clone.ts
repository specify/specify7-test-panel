import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser, noCaching } from '../../../../lib/apiUtils';
import { connectToDatabase } from '../../../../lib/database';

/**
 * Clone a database by copying all tables and data to a new database name.
 */
async function cloneDatabase(sourceDb: string, targetDb: string): Promise<void> {
  const connection = await connectToDatabase();

  // Create the new database
  await connection.execute(`CREATE DATABASE \`${targetDb}\``);

  // Get all tables from the source database
  const [tables] = await connection.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
    [sourceDb]
  );

  for (const { table_name } of tables as Array<{ table_name: string }>) {
    // Copy table structure
    await connection.execute(
      `CREATE TABLE \`${targetDb}\`.\`${table_name}\` LIKE \`${sourceDb}\`.\`${table_name}\``
    );
    // Copy table data
    await connection.execute(
      `INSERT INTO \`${targetDb}\`.\`${table_name}\` SELECT * FROM \`${sourceDb}\`.\`${table_name}\``
    );
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const { name } = req.query;
  const { newName } = req.body;

  if (typeof name !== 'string' || typeof newName !== 'string' || !newName.trim()) {
    res.status(400).send({ error: 'Invalid database name(s)' });
    return;
  }

  try {
    await cloneDatabase(name, newName);
    noCaching(res).status(200).send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error?.toString() });
  }
}
