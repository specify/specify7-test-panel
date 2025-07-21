import { cloneQueue } from './queue';
import { connectToDatabase } from './database';

cloneQueue.process(async (job) => {
  const { sourceDb, targetDb } = job.data;
  const connection = await connectToDatabase();
  await connection.execute(`CREATE DATABASE \`${targetDb}\``);
  const [tables] = await connection.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
    [sourceDb]
  );
  const total = (tables as Array<{ table_name: string }>).length;
  let current = 0;
  for (const { table_name } of tables as Array<{ table_name: string }>) {
    await connection.execute(
      `CREATE TABLE \`${targetDb}\`.\`${table_name}\` LIKE \`${sourceDb}\`.\`${table_name}\``
    );
    await connection.execute(
      `INSERT INTO \`${targetDb}\`.\`${table_name}\` SELECT * FROM \`${sourceDb}\`.\`${table_name}\``
    );
    current++;
    job.progress(Math.round((current / total) * 100));
  }
  return { total, current, done: true };
});
