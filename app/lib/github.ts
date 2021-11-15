import { organization, repository, targetTeams } from '../const/siteConfig';
import { RA } from './typescriptCommonTypes';
import { User } from './user';

export const queryGithubApi = async (token: string, query: string) =>
  fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  }).then((response) => response.json());

export type PullRequest = {
  readonly title: string;
  readonly commits: {
    readonly nodes: Readonly<
      [
        {
          readonly commit: {
            readonly statusCheckRollup: {
              readonly state:
                | 'EXPECTED'
                | 'ERROR'
                | 'FAILURE'
                | 'PENDING'
                | 'SUCCESS';
            };
          };
        }
      ]
    >;
  };
  readonly number: number;
  readonly mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN';
  readonly merged: boolean;
  readonly isDraft: boolean;
  readonly reviews: {
    readonly nodes: RA<{
      readonly state:
        | 'PENDING'
        | 'COMMENTED'
        | 'APPROVED'
        | 'CHANGES_REQUESTED'
        | 'DISMISSED';
      readonly author: {
        readonly login: string;
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
            reviews(first: 100) {
              nodes {
                state
                author {
                  ... on User {
                    login
                  }
                }
              }
            }
            reviewRequests(first: 10) {
              nodes {
                requestedReviewer {
                  ... on User {
                    username: name
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
      ({ mergeable, merged, isDraft, reviewRequests, reviews, commits }) =>
        mergeable === 'MERGEABLE' &&
        !merged &&
        !isDraft &&
        reviewRequests.nodes.length !== 0 &&
        commits.nodes[0].commit.statusCheckRollup.state === 'SUCCESS' &&
        reviews.nodes.filter(({ state }) => state !== 'APPROVED').length === 0
    )
    .filter(({ reviewRequests, reviews }) => {
      const approved = reviews.nodes
        .filter(({ state }) => state === 'APPROVED')
        .map(({ author }) => author.login);

      const pendingUserReviews = reviewRequests.nodes.filter(
        ({ requestedReviewer }) =>
          'username' in requestedReviewer &&
          !approved.includes(requestedReviewer.username)
      );

      const pendingTeamReviews = reviewRequests.nodes
        .filter(
          (
            requests
          ): requests is {
            readonly requestedReviewer: { readonly teamname: string };
          } =>
            approved.every(
              (username) =>
                !user.organization.teams[username].includes(
                  'teamname' in requests.requestedReviewer
                    ? requests.requestedReviewer.teamname
                    : ''
                )
            )
        )
        .map(({ requestedReviewer }) => requestedReviewer.teamname);

      return (
        pendingUserReviews.length === 0 &&
        pendingTeamReviews.some(teamName=>
          targetTeams.includes(teamName)
        ) &&
        pendingTeamReviews.length === 1
      );
    });
