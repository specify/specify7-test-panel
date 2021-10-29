# Specify 7 Test Panel

A cluster of Specify 7 instances for testing with automatic deployment,
authentication and a test panel for setting configuration

![Main Page](./docs/src/main-page.png)

## Deployment

To run the containers, generate `fullchain.pem` and `privkey.pem` (certificate
and the private key) using Let's Encrypt and put these files into the
`./config/` directory.

While in development, you can generate self-signed certificates:

```zsh
openssl req \
  -x509 -sha256 -nodes -newkey rsa:2048 -days 365 \
  -keyout ./config/privkey.pem \
  -out ./config/fullchain.pem
```

### Create a GitHub OAuth App

In order to enable authentication though GitHub and usage of GitHub APIs, a
GitHub OAuth application needs to be created.

This can be done for a GitHub organization or user profile:

1. Open organization / user settings on GitHub
2. On the sidebar, select "Developer Settings"
3. Select "OAuth Apps"
4. Press "New OAuth App"
5. Fill out the required information
6. Set authentication callback URL to this URL:
   ```
   https://localhost/sign-in
   ```
   When in production, replace `localhost` with the actual hostname
7. Press "Generate a new client secret"
8. Client ID and Client Secret is displayed on the OAUth app configuration page.
   You would need them for the next step:

### Configure Next.JS

Create `.env.local` file in the root folder of this repository:

```ini
NEXT_PUBLIC_GITHUB_CLIENT_ID=<client_id>
GITHUB_CLIENT_SECRET=<client_secret>

MYSQL_USERNAME=root
MYSQL_PASSWORD=root
MYSQL_HOST=mariadb
```

Replace `<client_id>` and `<client_secret>` with the actual values from the
OAuth app configuration page on GitHub (see previous step)

### Production

Run the containers:

```zsh
docker-compose -f docker-compose.production.yml up -d
```

Test Panel is now available at [https://localhost/](https://localhost/)

### Development

Run the containers:

```zsh
docker-compose up
```

Test Panel is now available at [https://localhost/](https://localhost/)

Next.JS has hot-reload enabled, so code changes are reflected in realtime.

Before committing changes, run `npm run test` to verify validity of TypeScript
types.
