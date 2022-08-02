import type { NextApiRequest, NextApiResponse } from 'next';

import type { IR, RA } from '../../../lib/typescriptCommonTypes';

export const getTags = async (image: string): Promise<IR<string>> =>
  fetch(
    `https://hub.docker.com/v2/repositories/specifyconsortium/${image}/tags/?page_size=1000`
  )
    .then(async (response) => response.json())
    .then(
      (tags: {
        readonly results: RA<{
          readonly name: string;
          readonly last_updated: string;
        }>;
      }) =>
        Object.fromEntries(
          tags.results
            .filter(({ name }) => !name.startsWith('sha-'))
            .map(({ name, last_updated }) => [name, last_updated])
            .sort(([nameLeft], [nameRight]) =>
              nameLeft < nameRight ? -1 : nameLeft === nameRight ? 0 : 1
            )
        )
    );

/*
 * Need to proxy this request though the back-end because dockerhub does not
 * send proper CORS headers
 */
export default async function handler(
  request: NextApiRequest,
  res: NextApiResponse
) {
  const image = request.query.image as string;
  await getTags(image)
    .then((tags) => res.status(200).json({ data: tags }))
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
