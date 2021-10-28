import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  getUserInfo,
  getUserTokenCookie,
  User,
} from '../components/UserContext';

export async function getUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<User | undefined> {
  const token = getUserTokenCookie(req.headers.cookie ?? '');

  if (typeof token === 'undefined') {
    res.status(403).json({ error: 'User not authenticated' });
    return undefined;
  }

  const user = await getUserInfo(token).catch(console.error);

  if (typeof user === 'undefined') {
    res.status(400).json({
      error: 'Bad request',
    });
    return undefined;
  }

  return user;
}

export async function fileExists(path: string) {
  try {
    await fs.promises.access(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
