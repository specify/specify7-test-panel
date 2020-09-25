import errno, re, tempfile, json
from os import environ, getenv, path
from subprocess import Popen, PIPE, call, check_call, check_output
from bottle import route, template, request, response, abort, static_file, redirect # type: ignore

from typing import Any

CHUNK_SIZE = 2**16

HOME_DIR = path.expanduser("~")
SELF_DIR = path.dirname(__file__)

SPECIFY7_DIRS = (
    path.join(HOME_DIR, "specify7-develop"),
    path.join(HOME_DIR, "specify7-master"),
)

DB_MAP_FILE = path.join(SELF_DIR, 'db_map.json')
APACHE_CONF_FILE = path.join(SELF_DIR, 'specifypanel_apache.conf')

# VIRTHOST_WSGI_FILES = [path.join(dir, 'specifyweb_vh.wsgi') for dir in SPECIFY7_DIRS]
WSGI_FILE = path.join(HOME_DIR, "servers", "tricky.wsgi")

PANEL_WSGI = path.join(SELF_DIR, 'specifypanel.wsgi')

MYSQL_HOST = environ['MYSQL_HOST']
# MYSQL_PORT = getenv('MYSQL_PORT', '3306')
MYSQL_USER = "-u" + environ['MYSQL_USER']
MYSQL_PASS = "-p" + environ['MYSQL_PASSWORD']

TESTUSER_PW = 'EC62DEF08F5E4FD556DAA86AEC5F3FB0390EF8A862A41ECA'

with open(APACHE_CONF_FILE) as f:
    conf = f.read()
    SERVERS = re.findall(r'Use +SpecifyVH +(.*)$', conf, re.MULTILINE)
    BRANCHES =  re.findall(r'Use +SpecifyVH +.* +(.*) +.*$', conf, re.MULTILINE)

@route('/')
def main() -> Any:
    try:
        with open(DB_MAP_FILE) as f:
            db_map = json.load(f)
    except IOError as e:
        if e.errno == errno.ENOENT:
            db_map = {}
        else:
            raise

    # for dir in SPECIFY7_DIRS:
    #     git_log = check_output(["/usr/bin/git",
    #                             "--work-tree=" + dir,
    #                             "--git-dir=" + path.join(dir, '.git'),
    #                             "log", "-n", "10"])


    show_databases = check_output(["/usr/bin/mysql", "-h", MYSQL_HOST, MYSQL_USER, MYSQL_PASS, "-e", "show databases"]).decode('utf-8')
    available_dbs = set(show_databases.split('\n')[1:]) - {'', 'information_schema', 'performance_schema', 'mysql', 'sys'}
    return template('main.tpl',
                    servers=SERVERS,
                    branches=BRANCHES,
                    db_map=db_map,
                    available_dbs=sorted(available_dbs, key=str.lower),
                    git_log="", #git_log,
                    host=request.get_header('Host'))

@route('/set_dbs/', method='POST')
def set_dbs() -> Any:
    db_map = {server: db
              for server in SERVERS
              for db in [ request.forms[server] ]
              if db != 'None'}
    with open(DB_MAP_FILE, 'w') as f:
        json.dump(db_map, f)

    check_call(['/usr/bin/touch', WSGI_FILE])

    redirect('/')

@route('/upload/')
def upload_form() -> Any:
    return template('upload_db.html')

@route('/upload/', method='POST')
def upload_db() -> Any:
    db_name = request.forms['dbname']
    upload_file = request.files['file'].file

    create_db_re = re.compile(r'^CREATE DATABASE.*$', re.M)
    use_db_re = re.compile(r'^USE `.*$', re.M)

    response.set_header('Content-Type', 'text/plain')

    yield "dropping db.\n"
    call(["/usr/bin/mysqladmin", "-f", MYSQL_USER, MYSQL_PASS, "drop", db_name])
    yield "creating db.\n"
    check_call(["/usr/bin/mysqladmin", MYSQL_USER, MYSQL_PASS, "create", db_name])
    yield "loading db.\n"
    mysql = Popen(["/usr/bin/mysql", MYSQL_USER, MYSQL_PASS, db_name], stdin=PIPE)

    loaded = 0
    for chunk in iter(lambda: upload_file.read(CHUNK_SIZE), ""):
        loaded += len(chunk)
        chunk = re.sub(create_db_re, '', chunk)
        chunk = re.sub(use_db_re, '', chunk)
        mysql.stdin.write(chunk)
        yield "loaded: %d\n" % loaded
    mysql.stdin.close()
    mysql.wait()

    yield "applying migrations.\n"
    dir = SPECIFY7_DIRS[0]
    check_call(['/usr/bin/make',
                '-C', dir,
                'django_migrations',
                'VIRTUAL_ENV=%s' % path.join(dir, 'virtualenv'),
                'SPECIFY_SIX=%s' % path.join(SELF_DIR, 'Specify6'),
                'SPECIFY_DATABASE_NAME=%s' % db_name])

    if 'reset_passwds' in request.forms:
        yield 'resetting passwords.\n'
        check_call(["/usr/bin/mysql", MYSQL_USER, MYSQL_PASS, db_name, '-e',
                    "update specifyuser set password = '%s'" % TESTUSER_PW])
    yield "done.\n"

@route('/export/')
def export() -> Any:
    db_name = request.query['dbname']
    mysqldump = Popen(["/usr/bin/mysqldump", MYSQL_USER, MYSQL_PASS, db_name], stdout=PIPE)

    response.set_header('Content-Type', 'text/plain')
    response.set_header('Content-Disposition', 'attachment; filename=%s.sql' % db_name)

    def result():
        for chunk in iter(lambda: mysqldump.stdout.read(CHUNK_SIZE), ""):
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
    call(["/usr/bin/mysqladmin", "-f", MYSQL_USER, MYSQL_PASS, "drop", db_name])
    redirect('/')

@route('/listusers/')
def list_users() -> Any:
    db_name = request.query['dbname']
    users = check_output(["/usr/bin/mysql", MYSQL_USER, MYSQL_PASS, db_name,
                          "--html", "-e", "select name, usertype from specifyuser"])
    yield users


@route('/github_hook/', method='POST')
def github_hook() -> Any:
    for dir in SPECIFY7_DIRS:
        check_call(["/usr/bin/git",
                    "--work-tree=" + dir,
                    "--git-dir=" + path.join(dir, '.git'),
                    "pull"])
    #     check_call(['/usr/bin/make', '-C', dir])

    # for f in VIRTHOST_WSGI_FILES:
    #     check_call(['/usr/bin/touch', f])
    # check_call(['/usr/bin/touch', PANEL_WSGI])


if __name__ == '__main__':
    from bottle import run, debug
    debug(True)
    run(host='0.0.0.0', port='8080', reloader=True)
