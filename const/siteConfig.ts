export const organization = 'specify';
export const repository = 'specify7';

// Auto deploy pull requests assigned for review by this team
export const team = 'ux-testing';

// Don't allow more than 6 simultaneous instances
export const maxDeployments = 6;

// Auto deployed instances may be garbage collected after 2 days
export const staleAfter = 60 * 60 * 24 * 2;

export const workingDirectory = './state';
