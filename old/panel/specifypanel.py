import errno, re, tempfile, json, requests, pickle
from glob import glob
from os import environ, getenv, path
from subprocess import Popen, PIPE, call, check_call, check_output
from bottle import route, template, request, response, abort, static_file, redirect # type: ignore
from uuid import uuid4

from typing import Any, Dict, List, Optional, NamedTuple

CHUNK_SIZE = 2**16

STATE_DIR = path.join(path.dirname(__file__), "state")

MYSQL_HOST = environ['MYSQL_HOST']
# MYSQL_PORT = getenv('MYSQL_PORT', '3306')
MYSQL_USER = "-u" + environ['MYSQL_USER']
MYSQL_PASS = "-p" + environ['MYSQL_PASSWORD']


class Sp7Server(NamedTuple):
    sp7_tag: str
    sp6_tag: str
    database: str

class State(NamedTuple):
    db1: Optional[Sp7Server]
    db2: Optional[Sp7Server]
    db3: Optional[Sp7Server]
    db4: Optional[Sp7Server]
    db5: Optional[Sp7Server]
    db6: Optional[Sp7Server]


def load_state() -> State:
    try:
        with open(path.join(STATE_DIR, "state.pickle"), "rb") as f:
            state = pickle.load(f)
            assert isinstance(state, State)
            return state
    except IOError as e:
        if e.errno == errno.ENOENT:
            return State(None,None,None,None,None,None)
        else:
            raise

def save_state(state: State, host: str) -> None:
    with open(path.join(STATE_DIR, "nginx.conf"), "w") as nginx:
        nginx.write(template('nginx.tpl', state=state, host=host))

    sp6_tags = set(s.sp6_tag for s in state if s is not None)

    with open(path.join(STATE_DIR, "docker-compose.override.yml"), "w") as docker_compose:
        docker_compose.write(template(
            'docker-compose.override.tpl',
            state=state,
            sp6_tags=sp6_tags,
            nginx_recreate=uuid4(),
            db_host=environ['MYSQL_HOST'],
            db_user=environ['MYSQL_USER'],
            db_pass=environ['MYSQL_PASSWORD'],
        ))

    with open(path.join(STATE_DIR, "state.pickle"), 'wb') as f:
        pickle.dump(state, f)

@route('/')
def main() -> Any:
    state = load_state()

    return template('main.html', state=state, host=request.get_header('Host'))