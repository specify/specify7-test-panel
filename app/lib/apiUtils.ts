import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'node:child_process';
import fs from 'node:fs';

import type { User } from './user';
import { getUserInfo, getUserTokenCookie } from './user';

export async function getUser(
  request: NextApiRequest,
  res: NextApiResponse
): Promise<User | undefined> {
  const token = getUserTokenCookie(request.headers.cookie ?? '');

  if (typeof token === 'undefined') {
    res.status(403).json({ error: 'User not authenticated' });
    return undefined;
  }

  const user: User | string = await getUserInfo(token).catch((error) =>
    error.toString()
  );

  if (typeof user === 'string') {
    res.status(400).json({
      error: user,
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

export async function run(command: string): Promise<string> {
  return new Promise((resolve, reject) =>
    exec(command, (error, stdout, stderr) =>
      error ? reject(error) : stderr ? reject(stderr) : resolve(stdout)
    )
  );
}

export function noCaching(res: NextApiResponse): NextApiResponse {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res;
}
