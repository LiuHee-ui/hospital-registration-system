(function () {
  if (!requireLogin()) return;
  renderUserBar();

  var msg = document.getElementById('msg');
  var tbody = document.getElementById('sched-body');
  var selectedId = null;
  var schedCache = [];
  var filterDate = '';

  var panelAdd = document.getElementById('panel-add');
  var panelEdit = document.getElementById('panel-edit');

  function hidePanels() {
    panelAdd.classList.add('is-hidden');
    panelEdit.classList.add('is-hidden');
  }

  function quotaStatusHtml(remain, total) {
    if (total === 0) return '<span class="badge badge--cancel">未配置</span>';
    var pct = remain / total;
    if (remain === 0) return '<span class="badge badge--cancel">号源已满</span>';
    if (pct <= 0.3) return '<span class="badge badge--pending">即将满号</span>';
    return '<span class="badge badge--done">充足</span>';
  }

  function rowHtml(r) {
    var remain = Number(r.remain_quota);
    var total = Number(r.total_quota);
    var used = Number(r.used_quota);
    var remainCls = remain === 0 ? 'style="color:#c62828;font-weight:700"' : remain <= 5 ? 'style="color:#e65100"' : '';
    return (
      '<tr data-id="' + escapeHtml(r.sched_id) + '">' +
      '<td>' + escapeHtml(r.sched_id) + '</td>' +
      '<td>' + escapeHtml(r.doctor_name) + ' (' + escapeHtml(r.doctor_id) + ')</td>' +
      '<td>' + escapeHtml(r.dept_name) + '</td>' +
      '<td>' + escapeHtml(r.sched_date ? String(r.sched_date).slice(0, 10) : '') + '</td>' +
      '<td>' + escapeHtml(total) + '</td>' +
      '<td>' + escapeHtml(used) + '</td>' +
      '<td ' + remainCls + '>' + escapeHtml(remain) + '</td>' +
      '<td>' + quotaStatusHtml(remain, total) + '</td>' +
      '<td><button class="btn-row-edit" data-id="' + escapeHtml(r.sched_id) + '">编辑</button> <button class="btn-row-del" data-id="' + escapeHtml(r.sched_id) + '">删除</button></td>' +
      '</tr>'
    );
  }

  function renderTable() {
    var rows = schedCache.slice().sort(function (a, b) {
      var da = String(a.sched_date).slice(0, 10);
      var db = String(b.sched_date).slice(0, 10);
      if (da !== db) return db.localeCompare(da);
      return String(a.doctor_id).localeCompare(String(b.doctor_id));
    });
    tbody.innerHTML = rows.map(rowHtml).join('');
    bindRows();
    setMsg(msg, filterDate ? '「' + filterDate + '」共 ' + rows.length + ' 条排班' : '共 ' + rows.length + ' 条排班记录', false);
  }

  function bindRows() {
    tbody.querySelectorAll('tr').forEach(function (tr) {
      tr.onclick = function (e) {
        if (e.target.classList.contains('btn-row-del') || e.target.classList.contains('btn-row-edit')) return;
        tbody.querySelectorAll('tr').forEach(function (x) { x.classList.remove('row-selected'); });
        tr.classList.add('row-selected');
        selectedId = tr.getAttribute('data-id');
        // 自动填入编辑框
        var found = schedCache.find(function (s) { return String(s.sched_id) === selectedId; });
        if (found) document.getElementById('edit-quota').value = found.total_quota;
        document.getElementById('edit-sched-id').value = selectedId || '';
      };
    });
    tbody.querySelectorAll('.btn-row-del').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        if (!confirm('确定删除排班 ID=' + id + ' 的号源记录？')) return;
        api('/schedules/' + encodeURIComponent(id), { method: 'DELETE' })
          .then(function () {
            setMsg(msg, '已删除', false);
            hidePanels();
            schedCache = schedCache.filter(function (s) { return String(s.sched_id) !== id; });
            selectedId = null;
            document.getElementById('edit-sched-id').value = '';
            renderTable();
          })
          .catch(function (e) { setMsg(msg, e.message, true); });
      };
    });
    tbody.querySelectorAll('.btn-row-edit').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        var found = schedCache.find(function (s) { return String(s.sched_id) === id; });
        if (found) {
          document.getElementById('edit-sched-id').value = id;
          document.getElementById('edit-quota').value = found.total_quota;
          selectedId = id;
          hidePanels();
          panelEdit.classList.remove('is-hidden');
          document.getElementById('edit-quota').focus();
        }
      };
    });
  }

  function load(date) {
    var url = date ? '/schedules?date=' + encodeURIComponent(date) : '/schedules';
    api(url)
      .then(function (rows) {
        if (!Array.isArray(rows)) { setMsg(msg, '数据异常', true); return; }
        schedCache = rows.slice();
        selectedId = null;
        renderTable();
      })
      .catch(function (e) { setMsg(msg, e.message, true); });
  }

  // 初始加载今天的号源
  var today = new Date().toISOString().slice(0, 10);
  document.getElementById('filter-date').value = today;
  filterDate = today;
  load(today);

  document.getElementById('btn-filter').onclick = function () {
    var d = document.getElementById('filter-date').value;
    if (!d) { setMsg(msg, '请选择日期', true); return; }
    filterDate = d;
    load(d);
  };

  document.getElementById('btn-clear-filter').onclick = function () {
    filterDate = '';
    document.getElementById('filter-date').value = '';
    load();
  };

  document.getElementById('btn-show-add').onclick = function () {
    hidePanels();
    panelAdd.classList.remove('is-hidden');
    // 默认填入今天日期
    if (!document.getElementById('add-date').value) {
      document.getElementById('add-date').value = today;
    }
    document.getElementById('add-doc-id').focus();
  };

  document.getElementById('btn-close-add').onclick = hidePanels;
  document.getElementById('btn-close-edit').onclick = hidePanels;

  document.getElementById('btn-submit-add').onclick = function () {
    var doctor_id = document.getElementById('add-doc-id').value.trim();
    var sched_date = document.getElementById('add-date').value;
    var total_quota = parseInt(document.getElementById('add-quota').value, 10);
    if (!doctor_id || !sched_date || isNaN(total_quota)) {
      setMsg(msg, '请填写医生编号、日期和号源总数', true);
      return;
    }
    api('/schedules', {
      method: 'POST',
      body: JSON.stringify({ doctor_id: doctor_id, sched_date: sched_date, total_quota: total_quota }),
    })
      .then(function (data) {
        setMsg(msg, '排班号源已添加', false);
        hidePanels();
        if (data.row) {
          data.row.remain_quota = Number(data.row.total_quota) - Number(data.row.used_quota);
          schedCache.push(data.row);
          renderTable();
        }
        document.getElementById('add-doc-id').value = '';
        document.getElementById('add-quota').value = '';
      })
      .catch(function (e) { setMsg(msg, e.message, true); });
  };

  document.getElementById('btn-submit-edit').onclick = function () {
    var id = document.getElementById('edit-sched-id').value.trim();
    var total_quota = parseInt(document.getElementById('edit-quota').value, 10);
    if (!id) { setMsg(msg, '请先在表格中选中一条排班记录', true); return; }
    if (isNaN(total_quota) || total_quota < 1) { setMsg(msg, '号源总数须为正整数', true); return; }
    api('/schedules/' + encodeURIComponent(id), {
      method: 'PUT',
      body: JSON.stringify({ total_quota: total_quota }),
    })
      .then(function () {
        setMsg(msg, '号源总数已更新', false);
        hidePanels();
        var found = schedCache.find(function (s) { return String(s.sched_id) === id; });
        if (found) {
          found.total_quota = total_quota;
          found.remain_quota = total_quota - Number(found.used_quota);
        }
        renderTable();
      })
      .catch(function (e) { setMsg(msg, e.message, true); });
  };
})();
