import type { NextApiRequest, NextApiResponse } from 'next';
import { getUser, noCaching } from '../../../../lib/apiUtils';
import { connectToDatabase } from '../../../../lib/database';

const cloneProgress: Record<string, { total: number; current: number; done: boolean; error?: string }> = {};
/**
 * Clone a database by copying all tables and data to a new database name.
 */
async function cloneDatabase(sourceDb: string, targetDb: string): Promise<void> {
  const connection = await connectToDatabase();
  await connection.execute(`CREATE DATABASE \`${targetDb}\``);
  const [tables] = await connection.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
    [sourceDb]
  );
  cloneProgress[targetDb] = { total: (tables as Array<{ table_name: string }>).length, current: 0, done: false };
  for (const { table_name } of tables as Array<{ table_name: string }>) {
    await connection.execute(
      `CREATE TABLE \`${targetDb}\`.
      \`${table_name}\` LIKE \`${sourceDb}\`.
      \`${table_name}\``
    );
    await connection.execute(
      `INSERT INTO \`${targetDb}\`.
      \`${table_name}\` SELECT * FROM \`${sourceDb}\`.
      \`${table_name}\``
    );
    cloneProgress[targetDb].current++;
  }
  cloneProgress[targetDb].done = true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUser(req, res);
  if (typeof user === 'undefined') return;

  if (req.method === 'GET') {
    const { newName } = req.query;
    if (typeof newName !== 'string' || !newName.trim()) {
      res.status(400).send({ error: 'Missing new database name' });
      return;
    }
    const status = cloneProgress[newName];
    if (!status) {
      res.status(404).send({ error: 'No clone in progress or not found' });
      return;
    }
    noCaching(res).status(200).json(status);
    return;
  }

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
    cloneProgress[newName] = { total: 1, current: 1, done: true, error: error?.toString() };
    res.status(500).send({ error: error?.toString() });
  }
}
