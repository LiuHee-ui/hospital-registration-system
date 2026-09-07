(function () {
  if (!requireLogin()) return;
  renderUserBar();
  var msg = document.getElementById('msg');
  var tbody = document.getElementById('dept-body');
  var selectedId = null;
  var panelAdd = document.getElementById('panel-add');
  var panelEdit = document.getElementById('panel-edit');
  var deptCache = [];

  function hidePanels() {
    panelAdd.classList.add('is-hidden');
    panelEdit.classList.add('is-hidden');
  }

  function clearEditForm() {
    document.getElementById('edit-dept-id').value = '';
    document.getElementById('edit-dept-name').value = '';
    document.getElementById('edit-dept-intro').value = '';
  }

  function bindRows() {
    tbody.querySelectorAll('tr').forEach(function (tr) {
      tr.onclick = function (e) {
        // 点到操作按钮时不触发行选中
        if (e.target.classList.contains('btn-row-del') || e.target.classList.contains('btn-row-edit')) return;
        tbody.querySelectorAll('tr').forEach(function (x) {
          x.classList.remove('row-selected');
        });
        tr.classList.add('row-selected');
        selectedId = tr.getAttribute('data-id');
        var cells = tr.querySelectorAll('td');
        document.getElementById('edit-dept-id').value = selectedId || '';
        document.getElementById('edit-dept-name').value = cells[1] ? cells[1].textContent : '';
        document.getElementById('edit-dept-intro').value = cells[2] ? cells[2].textContent : '';
      };
    });
    // 绑定每行删除按钮
    tbody.querySelectorAll('.btn-row-del').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        deleteDept(btn.getAttribute('data-id'));
      };
    });
    // 绑定每行编辑按钮
    tbody.querySelectorAll('.btn-row-edit').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        var row = deptCache.find(function (d) { return d.dept_id === id; });
        if (row) {
          document.getElementById('edit-dept-id').value = row.dept_id;
          document.getElementById('edit-dept-name').value = row.dept_name;
          document.getElementById('edit-dept-intro').value = row.dept_intro || '';
          selectedId = id;
          hidePanels();
          panelEdit.classList.remove('is-hidden');
          document.getElementById('edit-dept-name').focus();
        }
      };
    });
  }

  function deleteDept(id) {
    if (!confirm('确定删除科室 ' + id + '？')) return;
    api('/departments/' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function () {
        setMsg(msg, '已删除', false);
        hidePanels();
        deptCache = deptCache.filter(function (d) { return d.dept_id !== id; });
        clearEditForm();
        selectedId = null;
        renderTable();
      })
      .catch(function (e) { setMsg(msg, e.message, true); });
  }

  function renderTable() {
    var rows = deptCache.slice().sort(function (a, b) {
      return String(a.dept_id).localeCompare(String(b.dept_id));
    });
    tbody.innerHTML = rows
      .map(function (r) {
        return (
          '<tr data-id="' + escapeHtml(r.dept_id) + '">' +
          '<td>' + escapeHtml(r.dept_id) + '</td>' +
          '<td>' + escapeHtml(r.dept_name) + '</td>' +
          '<td>' + escapeHtml(r.dept_intro || '') + '</td>' +
          '<td><button class="btn-row-edit" data-id="' + escapeHtml(r.dept_id) + '">编辑</button> <button class="btn-row-del" data-id="' + escapeHtml(r.dept_id) + '">删除</button></td>' +
          '</tr>'
        );
      })
      .join('');
    bindRows();
  }

  function load() {
    api('/departments')
      .then(function (rows) {
        if (!Array.isArray(rows)) {
          setMsg(msg, '列表数据异常，请检查后端接口', true);
          return;
        }
        deptCache = rows.slice();
        selectedId = null;
        clearEditForm();
        renderTable();
        setMsg(msg, '已加载 ' + deptCache.length + ' 条科室', false);
      })
      .catch(function (e) {
        setMsg(msg, e.message + '（可先添加数据，列表会在本地显示）', true);
      });
  }

  function upsertDeptInCache(row) {
    var id = row.dept_id;
    var i = deptCache.findIndex(function (d) {
      return d.dept_id === id;
    });
    if (i >= 0) deptCache[i] = row;
    else deptCache.push(row);
  }

  document.getElementById('btn-show-add').onclick = function () {
    hidePanels();
    panelAdd.classList.remove('is-hidden');
    document.getElementById('add-dept-id').focus();
  };

  document.getElementById('btn-close-add').onclick = hidePanels;
  document.getElementById('btn-close-edit').onclick = hidePanels;

  document.getElementById('btn-reset-add').onclick = function () {
    document.getElementById('add-dept-id').value = '';
    document.getElementById('add-dept-name').value = '';
    document.getElementById('add-dept-intro').value = '';
  };

  document.getElementById('btn-submit-add').onclick = function () {
    var dept_id = document.getElementById('add-dept-id').value.trim();
    var dept_name = document.getElementById('add-dept-name').value.trim();
    var dept_intro = document.getElementById('add-dept-intro').value.trim();
    if (!dept_id || !dept_name) {
      setMsg(msg, '请填写科室编号与科室名称', true);
      return;
    }
    api('/departments', {
      method: 'POST',
      body: JSON.stringify({
        dept_id: dept_id,
        dept_name: dept_name,
        dept_intro: dept_intro,
      }),
    })
      .then(function (data) {
        setMsg(msg, '添加成功', false);
        document.getElementById('btn-reset-add').click();
        hidePanels();
        if (data.row) upsertDeptInCache(data.row);
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  };

  document.getElementById('btn-submit-edit').onclick = function () {
    var id = document.getElementById('edit-dept-id').value.trim();
    var dept_name = document.getElementById('edit-dept-name').value.trim();
    var dept_intro = document.getElementById('edit-dept-intro').value.trim();
    if (!id) {
      setMsg(msg, '请先在表格中选中要修改的科室', true);
      return;
    }
    if (!dept_name) {
      setMsg(msg, '科室名称不能为空', true);
      return;
    }
    api('/departments/' + encodeURIComponent(id), {
      method: 'PUT',
      body: JSON.stringify({
        dept_name: dept_name,
        dept_intro: dept_intro,
      }),
    })
      .then(function () {
        setMsg(msg, '修改成功', false);
        hidePanels();
        upsertDeptInCache({
          dept_id: id,
          dept_name: dept_name,
          dept_intro: dept_intro,
        });
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  };

  load();
})();
