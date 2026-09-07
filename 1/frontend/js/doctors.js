(function () {
  if (!requireLogin()) return;
  renderUserBar();
  var msg = document.getElementById('msg');
  var tbody = document.getElementById('doctor-body');
  var selectedId = null;
  var filterDept = '';
  var panelAdd = document.getElementById('panel-add');
  var panelEdit = document.getElementById('panel-edit');
  var doctorCache = [];

  function hidePanels() {
    panelAdd.classList.add('is-hidden');
    panelEdit.classList.add('is-hidden');
  }

  function clearEditForm() {
    document.getElementById('edit-doc-id').value = '';
    document.getElementById('edit-doc-name').value = '';
    document.getElementById('edit-doc-gender').value = '男';
    document.getElementById('edit-doc-title').value = '';
    document.getElementById('edit-doc-dept').value = '';
    document.getElementById('edit-doc-spec').value = '';
  }

  function bindRows() {
    tbody.querySelectorAll('tr').forEach(function (tr) {
      tr.onclick = function (e) {
        if (e.target.classList.contains('btn-row-del') || e.target.classList.contains('btn-row-edit')) return;
        tbody.querySelectorAll('tr').forEach(function (x) {
          x.classList.remove('row-selected');
        });
        tr.classList.add('row-selected');
        selectedId = tr.getAttribute('data-id');
        var cells = tr.querySelectorAll('td');
        document.getElementById('edit-doc-id').value = selectedId || '';
        document.getElementById('edit-doc-name').value = cells[1] ? cells[1].textContent : '';
        var g = cells[2] ? cells[2].textContent.trim() : '男';
        document.getElementById('edit-doc-gender').value = g === '女' ? '女' : '男';
        document.getElementById('edit-doc-title').value = cells[3] ? cells[3].textContent : '';
        document.getElementById('edit-doc-dept').value = cells[4] ? cells[4].textContent : '';
        document.getElementById('edit-doc-spec').value = cells[5] ? cells[5].textContent : '';
      };
    });
    tbody.querySelectorAll('.btn-row-del').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        if (!confirm('确定删除医生 ' + id + '？')) return;
        api('/doctors/' + encodeURIComponent(id), { method: 'DELETE' })
          .then(function () {
            setMsg(msg, '已删除', false);
            hidePanels();
            doctorCache = doctorCache.filter(function (d) { return d.doctor_id !== id; });
            clearEditForm();
            selectedId = null;
            renderTable();
          })
          .catch(function (e) { setMsg(msg, e.message, true); });
      };
    });
    tbody.querySelectorAll('.btn-row-edit').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        var row = doctorCache.find(function (d) { return d.doctor_id === id; });
        if (row) {
          document.getElementById('edit-doc-id').value = row.doctor_id;
          document.getElementById('edit-doc-name').value = row.doctor_name;
          document.getElementById('edit-doc-gender').value = row.gender || '男';
          document.getElementById('edit-doc-title').value = row.title;
          document.getElementById('edit-doc-dept').value = row.dept_id;
          document.getElementById('edit-doc-spec').value = row.specialty || '';
          selectedId = id;
          hidePanels();
          panelEdit.classList.remove('is-hidden');
          document.getElementById('edit-doc-name').focus();
        }
      };
    });
  }

  function renderTable() {
    var rows = doctorCache.slice().sort(function (a, b) {
      return String(a.doctor_id).localeCompare(String(b.doctor_id));
    });
    if (filterDept) {
      rows = rows.filter(function (d) {
        return d.dept_id === filterDept;
      });
    }
    tbody.innerHTML = rows
      .map(function (r) {
        var gen = r.gender != null && r.gender !== '' ? r.gender : '—';
        return (
          '<tr data-id="' + escapeHtml(r.doctor_id) + '">' +
          '<td>' + escapeHtml(r.doctor_id) + '</td>' +
          '<td>' + escapeHtml(r.doctor_name) + '</td>' +
          '<td>' + escapeHtml(gen) + '</td>' +
          '<td>' + escapeHtml(r.title) + '</td>' +
          '<td>' + escapeHtml(r.dept_id) + '</td>' +
          '<td>' + escapeHtml(r.specialty || '') + '</td>' +
          '<td><button class="btn-row-edit" data-id="' + escapeHtml(r.doctor_id) + '">编辑</button> <button class="btn-row-del" data-id="' + escapeHtml(r.doctor_id) + '">删除</button></td>' +
          '</tr>'
        );
      })
      .join('');
    bindRows();
    setMsg(
      msg,
      filterDept
        ? '筛选「' + filterDept + '」共 ' + rows.length + ' 人（共缓存 ' + doctorCache.length + ' 人）'
        : '已加载 ' + doctorCache.length + ' 位医生',
      false,
    );
  }

  function load() {
    api('/doctors')
      .then(function (rows) {
        if (!Array.isArray(rows)) {
          setMsg(msg, '列表数据异常，请检查后端接口', true);
          return;
        }
        doctorCache = rows.slice();
        selectedId = null;
        clearEditForm();
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message + '（可先添加数据，列表会在本地显示）', true);
      });
  }

  document.getElementById('btn-filter').onclick = function () {
    var d = document.getElementById('filter-dept-id').value.trim();
    if (!d) {
      setMsg(msg, '请输入科室编号再筛选', true);
      return;
    }
    filterDept = d;
    renderTable();
  };

  document.getElementById('btn-clear-filter').onclick = function () {
    filterDept = '';
    document.getElementById('filter-dept-id').value = '';
    renderTable();
  };

  document.getElementById('btn-show-add').onclick = function () {
    hidePanels();
    panelAdd.classList.remove('is-hidden');
    document.getElementById('add-doc-id').focus();
  };

  document.getElementById('btn-close-add').onclick = hidePanels;
  document.getElementById('btn-close-edit').onclick = hidePanels;

  document.getElementById('btn-reset-add').onclick = function () {
    document.getElementById('add-doc-id').value = '';
    document.getElementById('add-doc-name').value = '';
    document.getElementById('add-doc-gender').value = '';
    document.getElementById('add-doc-title').value = '';
    document.getElementById('add-doc-dept').value = '';
    document.getElementById('add-doc-spec').value = '';
  };

  function upsertDoctorInCache(row) {
    var id = row.doctor_id;
    var i = doctorCache.findIndex(function (d) {
      return d.doctor_id === id;
    });
    if (i >= 0) doctorCache[i] = row;
    else doctorCache.push(row);
  }

  document.getElementById('btn-submit-add').onclick = function () {
    var doctor_id = document.getElementById('add-doc-id').value.trim();
    var doctor_name = document.getElementById('add-doc-name').value.trim();
    var gender = document.getElementById('add-doc-gender').value;
    var title = document.getElementById('add-doc-title').value.trim();
    var dept_id = document.getElementById('add-doc-dept').value.trim();
    var specialty = document.getElementById('add-doc-spec').value.trim();
    if (!doctor_id || !doctor_name || !gender || !title || !dept_id) {
      setMsg(msg, '请填写医生编号、姓名、性别、职称、科室编号', true);
      return;
    }
    api('/doctors', {
      method: 'POST',
      body: JSON.stringify({
        doctor_id: doctor_id,
        doctor_name: doctor_name,
        gender: gender,
        title: title,
        dept_id: dept_id,
        specialty: specialty,
      }),
    })
      .then(function (data) {
        setMsg(msg, '添加成功', false);
        document.getElementById('btn-reset-add').click();
        hidePanels();
        filterDept = '';
        document.getElementById('filter-dept-id').value = '';
        if (data.row) upsertDoctorInCache(data.row);
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  };

  document.getElementById('btn-submit-edit').onclick = function () {
    var doctor_id = document.getElementById('edit-doc-id').value.trim();
    var doctor_name = document.getElementById('edit-doc-name').value.trim();
    var gender = document.getElementById('edit-doc-gender').value;
    var title = document.getElementById('edit-doc-title').value.trim();
    var dept_id = document.getElementById('edit-doc-dept').value.trim();
    var specialty = document.getElementById('edit-doc-spec').value.trim();
    if (!doctor_id) {
      setMsg(msg, '请先在表格中选中要修改的医生', true);
      return;
    }
    if (!doctor_name || !title || !dept_id) {
      setMsg(msg, '姓名、职称、科室编号不能为空', true);
      return;
    }
    api('/doctors/' + encodeURIComponent(doctor_id), {
      method: 'PUT',
      body: JSON.stringify({
        doctor_name: doctor_name,
        gender: gender,
        title: title,
        dept_id: dept_id,
        specialty: specialty,
      }),
    })
      .then(function () {
        setMsg(msg, '修改成功', false);
        hidePanels();
        upsertDoctorInCache({
          doctor_id: doctor_id,
          doctor_name: doctor_name,
          gender: gender,
          title: title,
          dept_id: dept_id,
          specialty: specialty,
        });
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  };

  load();
})();
