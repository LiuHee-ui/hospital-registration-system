(function () {
  if (!requireLogin()) return;
  renderUserBar();
  var msg = document.getElementById('msg');
  var tbody = document.getElementById('patient-body');
  var selectedId = null;
  var panelAdd = document.getElementById('panel-add');
  var panelEdit = document.getElementById('panel-edit');
  var patientCache = [];

  function hidePanels() {
    panelAdd.classList.add('is-hidden');
    panelEdit.classList.add('is-hidden');
  }

  function clearEditForm() {
    document.getElementById('edit-pid').value = '';
    document.getElementById('edit-pname').value = '';
    document.getElementById('edit-gender').value = '男';
    document.getElementById('edit-age').value = '';
    document.getElementById('edit-phone').value = '';
    document.getElementById('edit-birth').value = '';
    document.getElementById('edit-idcard').value = '';
    document.getElementById('edit-history').value = '';
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
        document.getElementById('edit-pid').value = selectedId || '';
        document.getElementById('edit-pname').value = cells[1] ? cells[1].textContent : '';
        var g = cells[2] ? cells[2].textContent : '男';
        document.getElementById('edit-gender').value = g === '女' ? '女' : '男';
        document.getElementById('edit-age').value = cells[3] ? cells[3].textContent : '';
        document.getElementById('edit-birth').value = cells[4] ? cells[4].textContent.replace(/[年月日]/g, '-').replace(/--/g, '-').replace(/-$/,'') : '';
        document.getElementById('edit-idcard').value = cells[5] ? cells[5].textContent : '';
        document.getElementById('edit-phone').value = cells[6] ? cells[6].textContent : '';
        document.getElementById('edit-history').value = cells[7] ? cells[7].textContent : '';
      };
    });
    tbody.querySelectorAll('.btn-row-del').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        if (!confirm('确定删除患者 ' + id + '？')) return;
        api('/patients/' + encodeURIComponent(id), { method: 'DELETE' })
          .then(function () {
            setMsg(msg, '已删除', false);
            hidePanels();
            patientCache = patientCache.filter(function (p) { return p.patient_id !== id; });
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
        var row = patientCache.find(function (p) { return p.patient_id === id; });
        if (row) {
          document.getElementById('edit-pid').value = row.patient_id;
          document.getElementById('edit-pname').value = row.patient_name;
          document.getElementById('edit-gender').value = row.gender || '男';
          document.getElementById('edit-age').value = row.age || '';
          document.getElementById('edit-phone').value = row.phone || '';
          document.getElementById('edit-birth').value = row.birth_date ? String(row.birth_date).slice(0,10) : '';
          document.getElementById('edit-idcard').value = row.id_card || '';
          document.getElementById('edit-history').value = row.medical_history || '';
          selectedId = id;
          hidePanels();
          panelEdit.classList.remove('is-hidden');
          document.getElementById('edit-pname').focus();
        }
      };
    });
  }

  function fmtBirth(d) {
    if (!d) return '—';
    var s = String(d);
    if (s.length === 10 && s[4] === '-') return s;
    return s.slice(0, 10);
  }

  function renderTable() {
    var rows = patientCache.slice().sort(function (a, b) {
      return String(a.patient_id).localeCompare(String(b.patient_id));
    });
    tbody.innerHTML = rows
      .map(function (r) {
        return (
          '<tr data-id="' + escapeHtml(r.patient_id) + '">' +
          '<td>' + escapeHtml(r.patient_id) + '</td>' +
          '<td>' + escapeHtml(r.patient_name) + '</td>' +
          '<td>' + escapeHtml(r.gender) + '</td>' +
          '<td>' + escapeHtml(r.age) + '</td>' +
          '<td>' + escapeHtml(fmtBirth(r.birth_date)) + '</td>' +
          '<td>' + escapeHtml(r.id_card || '—') + '</td>' +
          '<td>' + escapeHtml(r.phone) + '</td>' +
          '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(r.medical_history || '') + '">' + escapeHtml(r.medical_history || '—') + '</td>' +
          '<td><button class="btn-row-edit" data-id="' + escapeHtml(r.patient_id) + '">编辑</button> <button class="btn-row-del" data-id="' + escapeHtml(r.patient_id) + '">删除</button></td>' +
          '</tr>'
        );
      })
      .join('');
    bindRows();
    setMsg(msg, '已加载 ' + patientCache.length + ' 位患者', false);
  }

  function load() {
    api('/patients')
      .then(function (rows) {
        if (!Array.isArray(rows)) {
          setMsg(msg, '列表数据异常，请检查后端接口', true);
          return;
        }
        patientCache = rows.slice();
        selectedId = null;
        clearEditForm();
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message + '（可先添加数据，列表会在本地显示）', true);
      });
  }

  function upsertPatientInCache(row) {
    var id = row.patient_id;
    var i = patientCache.findIndex(function (p) {
      return p.patient_id === id;
    });
    if (i >= 0) patientCache[i] = row;
    else patientCache.push(row);
  }

  function collectAddForm() {
    return {
      patient_id: document.getElementById('add-pid').value.trim(),
      patient_name: document.getElementById('add-pname').value.trim(),
      gender: document.getElementById('add-gender').value,
      age: Number(document.getElementById('add-age').value),
      phone: document.getElementById('add-phone').value.trim(),
      birth_date: document.getElementById('add-birth').value || null,
      id_card: document.getElementById('add-idcard').value.trim() || null,
      medical_history: document.getElementById('add-history').value.trim() || null,
    };
  }

  document.getElementById('btn-show-add').onclick = function () {
    hidePanels();
    panelAdd.classList.remove('is-hidden');
    document.getElementById('add-pid').focus();
  };

  document.getElementById('btn-close-add').onclick = hidePanels;
  document.getElementById('btn-close-edit').onclick = hidePanels;

  document.getElementById('btn-reset-add').onclick = function () {
    document.getElementById('add-pid').value = '';
    document.getElementById('add-pname').value = '';
    document.getElementById('add-gender').value = '';
    document.getElementById('add-age').value = '';
    document.getElementById('add-phone').value = '';
    document.getElementById('add-birth').value = '';
    document.getElementById('add-idcard').value = '';
    document.getElementById('add-history').value = '';
  };

  document.getElementById('btn-submit-add').onclick = function () {
    var d = collectAddForm();
    if (!d.patient_id || !d.patient_name || !d.gender || !d.phone) {
      setMsg(msg, '请填写患者编号、姓名、性别与电话', true);
      return;
    }
    if (!d.age || d.age < 1 || d.age > 120) {
      setMsg(msg, '年龄须为 1–120 的数字', true);
      return;
    }
    api('/patients', {
      method: 'POST',
      body: JSON.stringify(d),
    })
      .then(function (data) {
        setMsg(msg, '添加成功', false);
        document.getElementById('btn-reset-add').click();
        hidePanels();
        if (data.row) upsertPatientInCache(data.row);
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  };

  document.getElementById('btn-submit-edit').onclick = function () {
    var patient_id = document.getElementById('edit-pid').value.trim();
    var patient_name = document.getElementById('edit-pname').value.trim();
    var gender = document.getElementById('edit-gender').value;
    var age = Number(document.getElementById('edit-age').value);
    var phone = document.getElementById('edit-phone').value.trim();
    var birth_date = document.getElementById('edit-birth').value || null;
    var id_card = document.getElementById('edit-idcard').value.trim() || null;
    var medical_history = document.getElementById('edit-history').value.trim() || null;
    if (!patient_id) {
      setMsg(msg, '请先在表格中选中要修改的患者', true);
      return;
    }
    if (!patient_name || !phone) {
      setMsg(msg, '姓名与电话不能为空', true);
      return;
    }
    if (!age || age < 1 || age > 120) {
      setMsg(msg, '年龄须为 1–120 的数字', true);
      return;
    }
    api('/patients/' + encodeURIComponent(patient_id), {
      method: 'PUT',
      body: JSON.stringify({
        patient_name: patient_name,
        gender: gender,
        age: age,
        phone: phone,
        birth_date: birth_date,
        id_card: id_card,
        medical_history: medical_history,
      }),
    })
      .then(function () {
        setMsg(msg, '修改成功', false);
        hidePanels();
        upsertPatientInCache({
          patient_id: patient_id,
          patient_name: patient_name,
          gender: gender,
          age: age,
          phone: phone,
          birth_date: birth_date,
          id_card: id_card,
          medical_history: medical_history,
        });
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  };

  load();
})();
