import { organization } from '../const/siteConfig';
import { queryGithubApi } from './github';
import { IR, R, RA } from './typescriptCommonTypes';

export type User = {
  readonly token: string;
  readonly name: string;
  readonly login: string;
  readonly organization: {
    readonly teams: IR<RA<string>>;
  };
};

export const getUserInfo = async (token: string): Promise<User> =>
  queryGithubApi(
    token,
    `{
  organization(login: "${organization}") {
    teams(first: 20) {
      nodes {
        name
        members(first: 20) {
          nodes {
            login
          }
        }
      }
    }
  }
  viewer {
    name
    login
  }
}`
  ).then(
    (response: {
      readonly data: {
        readonly organization: {
          readonly teams: {
            readonly nodes: RA<{
              readonly name: string;
              readonly members: {
                readonly nodes: RA<{
                  readonly login: string;
                }>;
              };
            }>;
          };
        };
        readonly viewer: {
          readonly name: string;
          readonly login: string;
        };
      };
    }) => {
      const teams = response.data.organization.teams.nodes
        .map(({ name, members }) => ({
          teamName: name,
          members: members.nodes.map(({ login }) => login),
        }))
        .reduce<R<string[]>>((people, { teamName, members }) => {
          members.forEach((username) => {
            people[username] ??= [];
            people[username].push(teamName);
          });
          return people;
        }, {});
      if (Object.keys(teams).length === 0)
        throw new Error(
          `User is not a member of the ${organization} organization`
        );
      return {
        token,
        name: response.data.viewer.name,
        login: response.data.viewer.login,
        organization: {
          teams,
        },
      };
    }
  );

export const getUserTokenCookie = (cookies: string): string | undefined =>
  cookies
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];
