FROM ubuntu:18.04 AS common

LABEL maintainer="Specify Collections Consortium <github.com/specify>"

RUN apt-get update && apt-get -y install --no-install-recommends \
        python3 \
        python3-venv \
        mariadb-client \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 999 specify && \
        useradd -r -u 999 -g specify specify

RUN mkdir -p /home/specify && chown specify.specify /home/specify

WORKDIR /home/specify
USER specify

COPY requirements.txt ./

RUN python3 -m venv ve
RUN ve/bin/pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["ve/bin/python", "./specifypanel.py"]
