version: '3.7'
services:
  
%for name, server in state._asdict().items():
%if server:
  {{name}}:
    image: specifyconsortium/specify7-service:{{server.sp7_tag}}
    init: true
    volumes:
      - "specify{{server.sp6_tag}}:/opt/Specify:ro"
      - "{{name}}-static-files:/volumes/static-files"
    environment:
      - DATABASE_NAME={{server.database}}
      - DATABASE_HOST={{db_host}}
      - MASTER_NAME={{db_user}}
      - MASTER_PASSWORD={{db_pass}}
      - SECRET_KEY="change this to some unique random string"
      - REPORT_RUNNER_HOST=report-runner
      - REPORT_RUNNER_PORT=8080
      - SP7_DEBUG=true
      - LOG_LEVEL=DEBUG
%end
%end

%for sp6_tag in sp6_tags:
  specify{{sp6_tag}}:
    image: specifyconsortium/specify6-service:{{sp6_tag}}
    volumes:
      - "specify{{sp6_tag}}:/volumes/Specify"
%end

  nginx:
    environment:
      - FORCE_RECREATE={{nginx_recreate}}
%if any(state):
    volumes:
%for name, server in state._asdict().items():  
%if server:
      - "{{name}}-static-files:/volumes/{{name}}-static-files:ro"
%end
%end
%for sp6_tag in sp6_tags:
      - "specify{{sp6_tag}}:/volumes/specify{{sp6_tag}}:ro"
%end
%end

%if any(state):
volumes:
%for name, server in state._asdict().items():  
%if server:
  {{name}}-static-files:
%end
%end

%for sp6_tag in sp6_tags:
  specify{{sp6_tag}}:
%end
%end
