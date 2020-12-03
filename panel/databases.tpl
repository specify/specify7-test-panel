%#  -*- html -*-
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>

<body>
  <h3>Test Databases</h3>
  <dl>
    %for db in available_dbs:
    <dt>{{db}}</dt>
    <dd>
      <a href="/export/?dbname={{db}}">export</a>
      <a href="/drop/?dbname={{db}}">drop</a>
      <!-- <a href="/sync/?dbname={{db}}">sync</a> -->
      <a href="/listusers/?dbname={{db}}">list users</a>
      <a href="/resetpasswds/?dbname={{db}}">reset-passwords</a>
    </dd>
    %end
    <dt>New</dt>
    <dd><a href="/upload/">import</a></dd>
  </dl>
</body>
</html>

