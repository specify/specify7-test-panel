export const queryGithubApi = async (token: string, query: string) => fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    Authorization: `bearer ${token}`,
  },
  body: JSON.stringify({query}),
});

