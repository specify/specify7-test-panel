import { ActiveDeployment } from './deployment';
import { RA } from './typescriptCommonTypes';

export const createNginxConfig = (
  deployments: RA<ActiveDeployment>,
  host: string
): string =>
  deployments
    .map(
      (deployment) => `
server {
    listen 443 ssl;
    server_name ${deployment.hostname}.${host};
    root /usr/share/nginx;

    ssl_certificate /etc/letsencrypt/live/test.specifysystems.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test.specifysystems.org/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 5m;
    ssl_prefer_server_ciphers on;
    client_max_body_size 128M;


    location /static/ {
        if ($request_method = 'GET') {
           add_header 'Access-Control-Allow-Origin' '*';
           add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
           add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
           add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        }
        root /volumes;
        rewrite ^/static/config/(.*)$ /specify${deployment.schemaVersion}/config/$1 break;
        rewrite ^/static/depository/(.*)$ /${deployment.hostname}-static-files/depository/$1 break;
        rewrite ^/static/(.*)$ /${deployment.hostname}-static-files/frontend-static/$1 break;
    }

    location / {
        if ($request_method = 'GET') {
           add_header 'Access-Control-Allow-Origin' '*';
           add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
           add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
           add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        }
        resolver 127.0.0.11 valid=30s;
        set $backend "http://${deployment.hostname}:8000";
        proxy_pass $backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`
    )
    .join('\n\n');
