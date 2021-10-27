<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>

<body>
  <h3>Reset Passwords</h3>
  <form method="post" action=".">
    <p>
      Passwords for all users in  database, {{repr(db)}}, will be reset to "testuser".
      Continue?
    </p>
    <input type="hidden" name="dbname" value="{{db}}" />
    <input type="submit" value="Yes" />
  </form>
</body>
</html>
