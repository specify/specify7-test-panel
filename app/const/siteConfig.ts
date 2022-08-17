export const organization = 'specify';
export const repository = 'specify7';

// Auto deploy pull requests assigned for review for these teams
export const targetTeams = ['UX Testing'];

/*
 * Don't allow more than 3 automatic deployments
 * This prevents overloading the hardware if there are a lot of pending
 * pull requests
 * The limit on the number of manual deployments has been removed, thus users
 * have to exercise caution when creating a lot of deployments.
 */
export const maxAutoDeployments = 3;

// Auto deployed instances may be garbage collected after 2 days
export const staleAfter = 60 * 60 * 24 * 2;

// Manually deployed instances may be garbage collected after 4 days
export const customStaleAfter = 2 * staleAfter;

// Path is relative to package.json
export const stateDirectory = '../state';
export const nginxConfDirectory = '../nginx.conf.d';

// Refresh deployment's state every 10 seconds
export const stateRefreshInterval = 10 * 1000;
