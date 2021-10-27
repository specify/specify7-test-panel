# Specify 7 Test Panel

A cluster of Specify 7 instances for testing with automatic deployment,
authentication  and a test panel for setting configuration

![Main Page](./docs/src/main-page.png)

## Create a GitHub OAuth App

In order to enable authentication though GitHub and usage of GitHub
APIs, a GitHub OAuth application needs to be configured.

This can be done for a GitHub organization or user profile:

1. Open organization / user settings on GitHub
2. On the sidebar, select "Developer Settings"
3. Select "OAuth Apps"
4. Press "New OAuth App"
5. Fill out the required information
6. Set authentication callback URL to this URL:
   ```
   http://localhost:3000/sign-in
   ```
   When in production, replace `http://localhost:3000` with the actual
   protocol + hostname
7. Press "Generate a new client secret"
8. In the repository, create an `.env.local` file:
   ```yaml
   NEXT_PUBLIC_GITHUB_CLIENT_ID=<client_id>
   GITHUB_CLIENT_SECRET=<client_secret>
   ```
   Replace `<client_id>` and `<client_secret>` with the actual values
   from the OAuth app configuration page on GitHub.

## Development

// TODO: update this documentation

```zsh
npm i  # install dependencies
npm run dev  # start development server
```

This would start the development server at [http://locahlost:3000](http://locahlost:3000)

## Production

```zsh
npm i  # install dependencies
npm run build  # begin build process
npm run start  # start production server
```

This would start the production server at [http://locahlost:3000](http://locahlost:3000)

Afterwards, you can deploy this site at [https://vercel.com](https://vercel.com)

Alternatively, you can to configure a reverse proxy (e.x Nginx)
that would handle the SSL certificate and forward the requests to
port 80, which should be made externally available.
