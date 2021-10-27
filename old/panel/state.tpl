%#  -*- html -*-
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>

<body>
  <h3>Configuration</h3>
  <form method="post" action="update_state/">
    <table style="text-align: center; width: 100%">
      <tr><th>Server</th><th>Specify7 Build</th><th>Specify6 Build</th><th>Database</th></tr>
      %for server, info in state._asdict().items():
      <tr>
        <td>{{server}}</td>
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
</body>
</html>

