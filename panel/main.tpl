%#  -*- html -*-
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>

<body>
  <h3>Specify Test Servers</h3>
  <form method="post" action="update_state/">
    <table style="text-align: center; width: 100%">
      <tr><th>Server</th><th>Specify7 Build</th><th>Specify6 Build</th><th>Database</th></tr>
      %for server, info in state._asdict().items():
      <tr>
        <td><a href="http://{{server + '.' + host}}/">{{server}}</a></td>
        <td>
          <select name="{{server}}-sp7-tag">
            %for choice in sp7_tags:
            <option value="{{choice.name}}" {{'selected' if info and choice.name == info.sp7_tag else ''}}>{{choice.name}}</option>
            %end
          </select>
        </td>
        <td>
          <select name="{{server}}-sp6-tag">
            %for choice in sp6_tags:
            <option value="{{choice.name}}" {{'selected' if info and choice.name == info.sp6_tag else ''}}>{{choice.name}}</option>
            %end
          </select>
        </td>
        <td>
          <select name="{{server}}-db">
            %for choice in available_dbs:
            <option value="{{choice}}" {{'selected' if info and choice == info.database else ''}}>{{choice}}</option>
            %end
          </select>
        </td>
      </tr>
      %end
    </table>
    <input id="update-state" type="submit" value="Apply">
  </form>
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

