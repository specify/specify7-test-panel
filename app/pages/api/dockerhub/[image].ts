import type { NextApiRequest, NextApiResponse } from 'next';

import type { IR, RA } from '../../../lib/typescriptCommonTypes';

export const fetchTagsForImage = async (image: string): Promise<IR<string>> =>
  fetchTags(
    `https://hub.docker.com/v2/repositories/specifyconsortium/${image}/tags/?page_size=1000`
  ).then(processTagsResponse);

type Response = {
  readonly results: RA<{
    readonly name: string;
    readonly last_updated: string;
  }>;
  readonly next: string | undefined;
};

export const fetchTags = async (url: string): Promise<Response['results']> =>
  fetch(url)
    .then(async (response) => response.json())
    .then(async ({ results, next }: Response) => [
      ...results,
      ...(typeof next === 'string' ? await fetchTags(next) : []),
    ]);

const processTagsResponse = (tags: Response['results']) =>
  Object.fromEntries(
    tags
      .filter(({ name }) => !name.startsWith('sha-'))
      .map(({ name, last_updated }) => [name, last_updated])
      .sort(([nameLeft], [nameRight]) =>
        nameLeft < nameRight ? -1 : nameLeft === nameRight ? 0 : 1
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
  await fetchTagsForImage(image)
    .then((tags) => res.status(200).json({ data: tags }))
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
