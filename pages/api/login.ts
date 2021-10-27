import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string | undefined;

  if (typeof code === 'undefined')
    return res.status(400).json({
      error: 'Bad request',
    });

  const queryString = Object.entries({
    client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
  }).map(([key, value]) => `${key}=${value}`).join('&');

  await fetch(`https://github.com/login/oauth/access_token?${queryString}`, {
    headers: {
      'Accept': 'application/json',
    },
    method: 'POST',
  }).then(response => response.json()).then(response => {
    if (response.error !== undefined)
      throw new Error(response.error);
    res.status(200).json({error: false, token: response.access_token});
  }).catch(error => res.status(400).json({error: error.toString()}));


}