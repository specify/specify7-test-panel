import type { NextApiRequest, NextApiResponse } from 'next';

import type { IR, RA } from '../../../lib/typescriptCommonTypes';
import { formatUrl, Writable } from '../../../lib/apiUtils';

// Docker Hub has a maximum of 10 pages for unauthenticated users
// At the 11th or higher page, Docker Hub will throw an error
const PAGE_MAX = 10;

// The default maximum page size set by Docker
const MAX_PAGE_SIZE = 100;

type TagOrderBy =
  | "last_updated"
  | "name"
  | "tag_status"
  | "tag_last_pulled"
  | "tag_last_pushed";

type TagFilter = {
  readonly orderBy?: TagOrderBy;
  readonly name?: string;
  readonly maxPages?: number;
  readonly pageSize?: number;
};

const DEFAULT_TAG_FILTER: TagFilter = {
  orderBy: "last_updated",
  maxPages: PAGE_MAX,
  pageSize: MAX_PAGE_SIZE,
};

export const SPECIAL_TAGS = {
  "specify7-service": [
    {
      // This is to make sure we have all of the v7 tags even if they're
      // excluded from the main tag fetch
      orderBy: "last_updated",
      name: "v7",
    },
    {
      name: "main",
      maxPages: 1,
    },
    {
      orderBy: "last_updated",
      maxPages: 5,
    },
  ],
} as const;


export type DockerHubTag = {
  readonly lastUpdated: string;
  readonly digest: string;
};

export const fetchTagsForImage = async (
  imageName: string,
  options?: RA<TagFilter>,
): Promise<IR<DockerHubTag>> =>
  Promise.allSettled(
    (options ?? [DEFAULT_TAG_FILTER]).map(
      async (filter) => await fetchTags(imageName, filter),
    ),
  )
    .then((results) =>
      results
        .filter(
          (
            result,
          ): result is PromiseFulfilledResult<SuccessfulResponse["results"]> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value),
    )
    .then((results) => mergeTagResponses(results))
    .then(processTagsResponse);



type SuccessfulResponse = {
  readonly results: RA<{
    readonly name: string;
    readonly last_updated: string;
    readonly digest: string;
    readonly images: RA<{
      readonly architecture: string;
    }>;
  }>;
  readonly next: string | undefined;
}

type ErrorResponse = {
  readonly errinfo: IR<unknown>;
  readonly message: string;
}

type Response = SuccessfulResponse | ErrorResponse

const mergeTagResponses = (responses: RA<SuccessfulResponse["results"]>) =>
  responses.reduce(
    (previous, current) => {
      current.forEach((tag) => {
        // We exclude already seen tags from the accumulated result
        if (!previous.seenDigests.has(tag.digest)) {
          previous.seenDigests.add(tag.digest);
          previous.merged.push(tag);
        }
      })
      return previous;
    },
    {
      seenDigests: new Set<string>(),
      merged: [] as Writable<SuccessfulResponse["results"]>,
    }
  ).merged;

const urlFromFilter = (
  image: string,
  filter: TagFilter,
  currentPage: number = 1,
) =>
  formatUrl(
    `https://hub.docker.com/v2/repositories/specifyconsortium/${image}/tags/`,
    {
      page_size: filter.pageSize ?? MAX_PAGE_SIZE,
      page: currentPage,
      ordering: filter.orderBy,
      name: filter.name,
    },
  );


async function _fetchTags(url: string, filter: TagFilter, currentPage: number = 1): Promise<SuccessfulResponse['results']> {
  return currentPage > (filter.maxPages ?? PAGE_MAX) ? Promise.resolve([]) : fetch(url)
    .then(async (response) => response.json())
    .then(async (response: Response) => {
      if ('message' in response) {
        return []
      }
      return [
        ...response.results,
        ...(typeof response.next === 'string' ?
          await _fetchTags(response.next, filter, currentPage + 1) : [])
      ]
    });
}

const fetchTags = async (
  imageName: string,
  filter: TagFilter,
): Promise<SuccessfulResponse["results"]> => {
  const url = urlFromFilter(imageName, filter);
  console.log("fetching URL ", url, " with filter ", filter);
  return _fetchTags(urlFromFilter(imageName, filter), filter);
}

const processTagsResponse = (tags: SuccessfulResponse['results']): IR<DockerHubTag> =>
  Object.fromEntries(
    tags
      // Latest is an unpredictable branch, thus will exclude it
      .filter(
        ({ name, images }) =>
          !name.startsWith('sha-') &&
          name !== 'latest' &&
          images.some(({ architecture }) => architecture === 'arm64')
      )
      .map(({ name, last_updated, digest }) => [
        name,
        {
          lastUpdated: last_updated,
          digest,
        },
      ])
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
  const specialFilters = SPECIAL_TAGS[image as keyof typeof SPECIAL_TAGS] as RA<TagFilter> | undefined;
  await fetchTagsForImage(image, specialFilters)
    .then((tags) => res.status(200).json({ data: tags }))
    .catch((error) => res.status(500).json({ error: error.toString() }));
}
