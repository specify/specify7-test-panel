import type { NextApiRequest, NextApiResponse } from 'next';

import { getUser } from '../../../../lib/apiUtils';
import { connectToDatabase } from '../../../../lib/database';
import { resetDatabasePasswords } from '../../../../lib/passwordUtils';

export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
) {
  if (request.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUser(request, res);
  if (typeof user === 'undefined') return;

  const databaseName = request.query.name as string;

  if (!databaseName) {
    return res.status(400).json({ error: 'Database name is required' });
  }

  // Validate database name to prevent SQL injection
  if (databaseName.match(/^\w+$/) === null) {
    return res.status(400).json({ error: 'Database name is invalid' });
  }

  try {
    const connection = await connectToDatabase();
    
    // Reset all user passwords to the test password
    await resetDatabasePasswords(connection, databaseName);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to reset passwords:', error);
    res.status(500).json({ error: error.toString() });
  }
}
