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

TESTUSER_PW = 'EC62DEF08F5E4FD556DAA86AEC5F3FB0390EF8A862A41ECA'

class Tag(NamedTuple):
    name: str
    updated: str

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


def get_tags(image: str) -> List[Tag]:
    resp = requests.get("https://hub.docker.com/v2/repositories/specifyconsortium/{}/tags/".format(image)).json()
    tags = [
        Tag(r['name'], r['last_updated'])
        for r in resp['results']
        if not r['name'].startswith('sha')
    ]
    return sorted(tags, key=lambda tag: tag.name, reverse=True)

@route('/')
def main() -> Any:
    state = load_state()

    return template('main.html', state=state, host=request.get_header('Host'))

@route('/configure/')
def state() -> Any:
    state = load_state()

    sp7_tags = get_tags("specify7-service")
    sp6_tags = get_tags("specify6-service")
    show_databases = check_output(["/usr/bin/mysql", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, "-e", "show databases"]).decode('utf-8')
    available_dbs = set(show_databases.split('\n')[1:]) - {'', 'information_schema', 'performance_schema', 'mysql', 'sys'}
    return template('state.tpl',
                    sp7_tags=sp7_tags,
                    sp6_tags=sp6_tags,
                    state=state,
                    available_dbs=sorted(available_dbs, key=str.lower),
                    git_log="", #git_log,
                    host=request.get_header('Host'))


@route('/configure/update_state/', method='POST')
def update_state() -> Any:
    state = State._make(
        Sp7Server(
            sp7_tag=request.forms[server + "-sp7-tag"],
            sp6_tag=request.forms[server + "-sp6-tag"],
            database=request.forms[server + "-db"],
        )
        for server in State._fields
    )

    save_state(state, request.get_header('Host'))
    redirect('/')

@route('/upload/')
def upload_form() -> Any:
    return template('upload_db.html')

@route('/upload/', method='POST')
def upload_db() -> Any:
    db_name = request.forms['dbname']
    upload_file = request.files['file'].file

    create_db_re = re.compile(b'^CREATE DATABASE.*$', re.M)
    use_db_re = re.compile(b'^USE `.*$', re.M)

    response.set_header('Content-Type', 'text/plain')

    yield "dropping db.\n"
    call(["/usr/bin/mysqladmin", "-f", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, "drop", db_name])
    yield "creating db.\n"
    check_call(["/usr/bin/mysqladmin", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, "create", db_name])
    yield "loading db.\n"
    mysql = Popen(["/usr/bin/mysql", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, db_name], stdin=PIPE)
    assert mysql.stdin is not None

    loaded = 0
    for chunk in iter(lambda: upload_file.read(CHUNK_SIZE), b""):
        loaded += len(chunk)
        chunk = re.sub(create_db_re, '', chunk)
        chunk = re.sub(use_db_re, '', chunk)
        mysql.stdin.write(chunk)
        yield "loaded: %d\n" % loaded
    mysql.stdin.close()
    mysql.wait()

    # yield "applying migrations.\n"
    # dir = SPECIFY7_DIRS[0]
    # check_call(['/usr/bin/make',
    #             '-C', dir,
    #             'django_migrations',
    #             'VIRTUAL_ENV=%s' % path.join(dir, 'virtualenv'),
    #             'SPECIFY_SIX=%s' % path.join(SELF_DIR, 'Specify6'),
    #             'SPECIFY_DATABASE_NAME=%s' % db_name])

    if 'reset_passwds' in request.forms:
        yield 'resetting passwords.\n'
        check_call(["/usr/bin/mysql", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, db_name, '-e',
                    "update specifyuser set password = '%s'" % TESTUSER_PW])
    yield "done.\n"

@route('/export/')
def export() -> Any:
    db_name = request.query['dbname']
    mysqldump = Popen(["/usr/bin/mysqldump", "-q", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, db_name], stdout=PIPE)

    response.set_header('Content-Type', 'text/plain')
    response.set_header('Content-Disposition', 'attachment; filename=%s.sql' % db_name)

    def result():
        for chunk in iter(lambda: mysqldump.stdout.read(CHUNK_SIZE), b""):
            yield chunk
        mysqldump.wait()

    return result()

@route('/drop/')
def drop_form() -> Any:
    db_name = request.query['dbname']
    return template('drop.tpl', db=db_name)

@route('/drop/', method='POST')
def drop() -> Any:
    db_name = request.forms['dbname']
    call(["/usr/bin/mysqladmin", "-f", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, "drop", db_name])
    redirect('/')

@route('/resetpasswds/')
def reset_passwords_form():
    db_name = request.query['dbname']
    return template('reset_passwords.tpl', db=db_name)

@route('/resetpasswds/', method='POST')
def reset_passwords():
    db_name = request.forms['dbname']
    check_call(["/usr/bin/mysql", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, db_name, '-e',
                "update specifyuser set password = '%s'" % TESTUSER_PW])
    redirect('/')

@route('/listusers/')
def list_users() -> Any:
    db_name = request.query['dbname']
    users = check_output(["/usr/bin/mysql", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, db_name,
                          "--html", "-e", "select name, usertype from specifyuser"])
    yield users


if __name__ == '__main__':
    from bottle import run, debug

    debug(True)
    run(host='0.0.0.0', port='8080')
