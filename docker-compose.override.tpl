version: '3.7'
services:
  
%for name, server in state._asdict().items():
%if server:
  {{name}}:
    image: specifyconsortium/specify7-service:{{server.tag}}
    init: true
    volumes:
      - "specify6:/opt/Specify:ro"
      - "{{name}}-static-files:/volumes/static-files"
    environment:
      - DATABASE_NAME={{server.database}}
      - DATABASE_HOST=mariadb
      - MASTER_NAME=master
      - MASTER_PASSWORD=master
      - SECRET_KEY="change this to some unique random string"
      - REPORT_RUNNER_HOST=report-runner
      - REPORT_RUNNER_PORT=8080
      - SP7_DEBUG=true
      - LOG_LEVEL=DEBUG
%end
%end

  nginx:
    environment:
      - FORCE_RECREATE={{nginx_recreate}}

    volumes:
%for name, server in state._asdict().items():  
%if server:
      - "{{name}}-static-files:/volumes/db1-static-files:ro"
%end
%end

volumes:
%for name, server in state._asdict().items():  
%if server:
  {{name}}-static-files:
%end
%end
