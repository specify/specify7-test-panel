import type { Connection } from 'mysql2/promise';

const testPassword = 'EC62DEF08F5E4FD556DAA86AEC5F3FB0390EF8A862A41ECA';

/**
 * Resets all user passwords in the specified database
 */
export async function resetDatabasePasswords(
  connection: Connection,
  databaseName: string
): Promise<void> {
  await connection.execute(
    `UPDATE \`${databaseName}\`.specifyuser
     SET Password=?;`,
    [testPassword]
  );
}

export { testPassword };
