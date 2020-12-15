
%for name, server in state._asdict().items():
%if server:
server {
    listen 80;
    server_name {{name}}.{{host}};
    root /usr/share/nginx;

    location /static/ {
        if ($request_method = 'GET') {
           add_header 'Access-Control-Allow-Origin' '*';
           add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
           add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
           add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        }
        root /volumes;
        rewrite ^/static/config/(.*)$ /specify{{server.sp6_tag}}/config/$1 break;
        rewrite ^/static/depository/(.*)$ /{{name}}-static-files/depository/$1 break;
        rewrite ^/static/(.*)$ /{{name}}-static-files/frontend-static/$1 break;
    }

    location / {
        if ($request_method = 'GET') {
           add_header 'Access-Control-Allow-Origin' '*';
           add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
           add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
           add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        }
        resolver 127.0.0.11 valid=30s;
        set $backend "http://{{name}}:8000";
        proxy_pass $backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

%end
%end
