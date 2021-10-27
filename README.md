# Specify 7 Test Panel

A cluster of Specify 7 instances for testing with automatic deployment,
authentication  and a test panel for setting configuration

![Main Page](./docs/src/main-page.png)

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
