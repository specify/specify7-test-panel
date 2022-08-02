import { organization, repository, targetTeams } from '../const/siteConfig';
import type { R, RA } from './typescriptCommonTypes';
import type { User } from './user';

export const queryGithubApi = async (token: string, query: string) =>
  fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  }).then(async (response) => response.json());

export type PullRequest = {
  readonly title: string;
  readonly commits: {
    readonly nodes: Readonly<
      readonly [
        {
          readonly commit: {
            readonly statusCheckRollup?: {
              readonly state:
                'ERROR' | 'EXPECTED' | 'FAILURE' | 'PENDING' | 'SUCCESS';
            };
          };
        }
      ]
    >;
  };
  readonly number: number;
  readonly mergeable: 'CONFLICTING' | 'MERGEABLE' | 'UNKNOWN';
  readonly merged: boolean;
  readonly isDraft: boolean;
  readonly reviews: {
    readonly nodes: RA<{
      readonly state: 'APPROVED' | 'CHANGES_REQUESTED';
      readonly publishedAt: string;
      readonly author: {
        readonly username: string;
      };
    }>;
  };
  readonly reviewRequests: {
    readonly nodes: RA<{
      readonly requestedReviewer:
        | {
            readonly teamname: string;
          }
        | {
            readonly username: string;
          };
    }>;
  };
  readonly closingIssuesReferences: {
    readonly nodes: RA<{
      readonly number: number;
      readonly title: string;
    }>;
  };
  readonly headRefName: string;
};

export const getPullRequests = async (user: User): Promise<RA<PullRequest>> =>
  queryGithubApi(
    user.token,
    `{
      repository(name: "${repository}", owner: "${organization}") {
        pullRequests(
          orderBy: {
            field: UPDATED_AT,
            direction: DESC
          },
          states: OPEN,
          first: 100
        ) {
          nodes {
            title
            commits(last: 1) {
              nodes {
                commit {
                  statusCheckRollup {
                    state
                  }
                }
              }
            }
            number
            mergeable
            merged
            isDraft
            reviews(first: 100, states: [APPROVED, CHANGES_REQUESTED]) {
              nodes {
                state
                publishedAt
                author {
                  ... on User {
                    username: login
                  }
                }
              }
            }
            reviewRequests(first: 10) {
              nodes {
                requestedReviewer {
                  ... on User {
                    username: login
                  }
                  ... on Team {
                    teamname: name
                  }
                }
              }
            }
            closingIssuesReferences(first: 10) {
              nodes {
                number
                title
              }
            }
            headRefName
          }
        }
      }
    }`
  ).then(
    (response: {
      readonly data: {
        readonly repository: {
          readonly pullRequests: {
            readonly nodes: RA<PullRequest>;
          };
        };
      };
    }) => filterPullRequests(response.data.repository.pullRequests.nodes, user)
  );

const filterPullRequests = (
  pullRequests: RA<PullRequest>,
  user: User
): RA<PullRequest> =>
  pullRequests
    .filter(
      ({ mergeable, merged, isDraft, reviewRequests, commits }) =>
        mergeable === 'MERGEABLE' &&
        !merged &&
        !isDraft &&
        reviewRequests.nodes.length > 0 &&
        commits.nodes[0].commit.statusCheckRollup?.state === 'SUCCESS'
    )
    .filter(({ reviewRequests, reviews }) => {
      const mostRecentReviews = Object.entries(
        reviews.nodes.reduce<
          R<{
            readonly state: 'APPROVED' | 'CHANGES_REQUESTED';
            readonly publishedAt: string;
          }>
        >((reduced, { state, publishedAt, author: { username } }) => {
          if (
            !(username in reduced) ||
            new Date(publishedAt).getTime() >
              new Date(reduced[username].publishedAt).getTime()
          )
            reduced[username] = { state, publishedAt };
          return reduced;
        }, {})
      ).map(([username, { state }]) => ({ username, state }));

      const approved = mostRecentReviews
        .filter(({ state }) => state === 'APPROVED')
        .map(({ username }) => username);

      if (mostRecentReviews.length !== approved.length) return false;

      const pendingUserReviews = reviewRequests.nodes
        .map(
          ({ requestedReviewer }) =>
            'username' in requestedReviewer && requestedReviewer.username
        )
        .filter(
          (username): username is string =>
            typeof username === 'string' && !approved.includes(username)
        );

      const pendingNonTargetTeamMemberReviews = pendingUserReviews.filter(
        (username) =>
          targetTeams.every(
            (teamName) => !user.organization.teams[teamName].includes(username)
          )
      );

      const isAssignedToTargetTeamMember = Boolean(pendingUserReviews.length - pendingNonTargetTeamMemberReviews.length);

      const pendingTeamReviews = reviewRequests.nodes
        .map(
          (requests) =>
            'teamname' in requests.requestedReviewer &&
            requests.requestedReviewer.teamname
        )
        .filter(
          (teamName): teamName is string =>
            teamName !== false &&
            teamName.length > 0 &&
            approved.every(
              (username) =>
                !user.organization.teams[teamName].includes(username)
            )
        );

      const pendingNonTargetTeamReviews = pendingTeamReviews.filter(
        (teamName) => !targetTeams.includes(teamName)
      );

      const isAssignedToTargetTeam = Boolean(pendingTeamReviews.length - pendingNonTargetTeamReviews.length);

      return (
        (isAssignedToTargetTeam || isAssignedToTargetTeamMember) &&
        pendingNonTargetTeamMemberReviews.length === 0 &&
        pendingNonTargetTeamReviews.length === 0
      );
    });
