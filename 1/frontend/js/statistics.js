(function () {
  if (!requireLogin()) return;
  renderUserBar();
  var msg = document.getElementById('msg');

  function refresh() {
    Promise.all([api('/statistics/summary'), api('/statistics/by-dept')])
      .then(function (results) {
        var sum = results[0];
        var byDept = results[1];
        if (!sum || sum.total === undefined || !Array.isArray(byDept)) {
          setMsg(msg, '统计数据格式异常，请检查后端接口', true);
          return;
        }
        document.getElementById('stat-total').textContent = sum.total;
        document.getElementById('stat-pending').textContent = sum.pending;
        document.getElementById('stat-visited').textContent = sum.visited;
        document.getElementById('stat-cancelled').textContent = sum.cancelled;
        var tbody = document.getElementById('dept-stat-body');
        tbody.innerHTML = byDept
          .map(function (r) {
            return (
              '<tr><td>' +
              escapeHtml(r.dept_id) +
              '</td><td>' +
              escapeHtml(r.dept_name) +
              '</td><td>' +
              escapeHtml(r.reg_count) +
              '</td></tr>'
            );
          })
          .join('');
        setMsg(msg, '统计已从数据库刷新', false);
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  }

  refresh();
})();
