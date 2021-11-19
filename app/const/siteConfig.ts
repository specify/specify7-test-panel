export const organization = 'specify';
export const repository = 'specify7';

// Auto deploy pull requests assigned for review for these teams
export const targetTeams = ['UX Testing', 'Testing'];

// Don't allow more than 6 simultaneous instances
export const maxDeployments = 6;

// Auto deployed instances may be garbage collected after 2 days
export const staleAfter = 60 * 60 * 24 * 2;

// Manually deployed instances may be garbage collected after 4 days
export const customStaleAfter = 2 * staleAfter;

// Path is relative to package.json
export const stateDirectory = '../state';
export const nginxConfDirectory = '../nginx.conf.d';

// Refresh deployment's state every 10 seconds
export const stateRefreshInterval = 10 * 1000;
