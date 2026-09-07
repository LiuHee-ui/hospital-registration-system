(function () {
  if (!requireLogin()) return;
  renderUserBar();

  var msg = document.getElementById('msg');
  var tbody = document.getElementById('reg-body');
  var selectedId = null;
  var panelNew = document.getElementById('panel-new');
  var panelStatus = document.getElementById('panel-status');
  var regCache = [];

  var departments = [];
  var doctors = [];

  var selDept = document.getElementById('sel-dept');
  var quotaInfo = document.getElementById('quota-info');
  var doctorIntro = document.getElementById('doctor-intro');
  var doctorCardsContainer = document.getElementById('doctor-cards-container');
  var doctorCards = document.getElementById('doctor-cards');
  var selectedDoctorId = null;

  /* ---- 全局状态 ---- */
  var cameraStream = null;

  /* ---- 工具 ---- */
  function hidePanels() {
    panelNew.classList.add('is-hidden');
    panelStatus.classList.add('is-hidden');
    stopCamera();
  }

  function formatTime(v) {
    if (!v) return '';
    var s = String(v);
    return s.length >= 16 ? s.slice(0, 16).replace('T', ' ') : s;
  }

  function statusBadgeClass(st) {
    if (st === '已就诊') return 'badge badge--done';
    if (st === '已取消') return 'badge badge--cancel';
    return 'badge badge--pending';
  }

  function deleteReg(regId) {
    if (!confirm('确定删除挂号 ' + regId + '？')) return;
    api('/registrations/' + encodeURIComponent(regId), { method: 'DELETE' })
      .then(function () {
        setMsg(msg, '已删除', false);
        hidePanels();
        regCache = regCache.filter(function (r) { return r.reg_id !== regId; });
        selectedId = null;
        renderTable();
      })
      .catch(function (e) { setMsg(msg, e.message, true); });
  }

  function rowHtml(r) {
    var urgentBadge = r.is_urgent
      ? '<span class="badge badge--urgent">加急</span>'
      : '<span style="color:#999;font-size:0.8em;">—</span>';
    return (
      '<tr data-id="' + escapeHtml(r.reg_id) + '" data-status="' + escapeHtml(r.visit_status) + '">' +
      '<td>' + escapeHtml(r.reg_id) + '</td>' +
      '<td>' + escapeHtml(r.patient_name) + ' (' + escapeHtml(r.patient_id) + ')</td>' +
      '<td>' + escapeHtml(r.doctor_name) + '</td>' +
      '<td>' + escapeHtml(r.dept_name || '') + '</td>' +
      '<td>' + escapeHtml(formatTime(r.reg_time)) + '</td>' +
      '<td>' + urgentBadge + '</td>' +
      '<td><span class="' + statusBadgeClass(r.visit_status) + '">' + escapeHtml(r.visit_status) + '</span></td>' +
      '<td><button class="btn-row-edit" data-id="' + escapeHtml(r.reg_id) + '">编辑</button> <button class="btn-row-del" data-id="' + escapeHtml(r.reg_id) + '">删除</button></td>' +
      '</tr>'
    );
  }

  function sortRegCache() {
    regCache.sort(function (a, b) {
      if (b.is_urgent !== a.is_urgent) return (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0);
      var ta = new Date(a.reg_time).getTime();
      var tb = new Date(b.reg_time).getTime();
      if (tb !== ta) return tb - ta;
      return String(a.reg_id).localeCompare(String(b.reg_id));
    });
  }

  function bindRows() {
    tbody.querySelectorAll('tr').forEach(function (tr) {
      tr.onclick = function (e) {
        if (e.target.classList.contains('btn-row-del') || e.target.classList.contains('btn-row-edit')) return;
        tbody.querySelectorAll('tr').forEach(function (x) { x.classList.remove('row-selected'); });
        tr.classList.add('row-selected');
        selectedId = tr.getAttribute('data-id');
        var st = tr.getAttribute('data-status');
        var sel = document.getElementById('status-change');
        if (sel && st && ['未就诊', '已就诊', '已取消'].indexOf(st) >= 0) {
          sel.value = st;
        }
      };
    });
    tbody.querySelectorAll('.btn-row-del').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        deleteReg(btn.getAttribute('data-id'));
      };
    });
    tbody.querySelectorAll('.btn-row-edit').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        var row = regCache.find(function (r) { return r.reg_id === id; });
        if (row) {
          selectedId = id;
          var st = row.visit_status;
          var sel = document.getElementById('status-change');
          if (sel && st && ['未就诊', '已就诊', '已取消'].indexOf(st) >= 0) {
            sel.value = st;
          }
          // 高亮选中行
          tbody.querySelectorAll('tr').forEach(function (x) { x.classList.remove('row-selected'); });
          var trEl = tbody.querySelector('tr[data-id="' + id + '"]');
          if (trEl) trEl.classList.add('row-selected');
          hidePanels();
          panelStatus.classList.remove('is-hidden');
        }
      };
    });
  }

  function renderTable() {
    sortRegCache();
    tbody.innerHTML = regCache.map(rowHtml).join('');
    bindRows();
    setMsg(msg, '共 ' + regCache.length + ' 条挂号记录', false);
  }

  function load() {
    api('/registrations')
      .then(function (rows) {
        if (!Array.isArray(rows)) {
          setMsg(msg, '列表数据异常，请检查后端接口', true);
          return;
        }
        regCache = rows.slice();
        selectedId = null;
        renderTable();
      })
      .catch(function (e) {
        setMsg(msg, e.message + '（提交新挂号后可在本地列表显示）', true);
      });
  }

  function fillDeptSelect() {
    var cur = selDept.value;
    selDept.innerHTML =
      '<option value="">请选择科室…</option>' +
      departments.map(function (d) {
        return '<option value="' + escapeHtml(d.dept_id) + '">' +
          escapeHtml(d.dept_id + ' · ' + d.dept_name) + '</option>';
      }).join('');
    if (cur && departments.some(function (d) { return d.dept_id === cur; })) {
      selDept.value = cur;
    }
  }

  /* ===== 医生卡片滑动选择 ===== */
  function renderDoctorCards(deptId) {
    selectedDoctorId = null;
    doctorCards.classList.remove('doctor-cards--has-selected');
    doctorIntro.classList.add('is-hidden');
    quotaInfo.classList.add('is-hidden');

    if (!deptId) {
      doctorCardsContainer.classList.add('is-hidden');
      return;
    }

    var list = doctors.filter(function (doc) { return doc.dept_id === deptId; });
    if (list.length === 0) {
      doctorCardsContainer.classList.remove('is-hidden');
      doctorCards.innerHTML = '<div class="doctor-cards-empty">该科室暂无医生数据</div>';
      return;
    }

    var deptInfo = departments.find(function (d) { return d.dept_id === deptId; });
    doctorCardsContainer.classList.remove('is-hidden');

    var html = '';
    list.forEach(function (doc) {
      var genderEmoji = doc.gender === '女' ? '👩‍⚕️' : '👨‍⚕️';
      html +=
        '<div class="doc-card" data-doctor-id="' + escapeHtml(doc.doctor_id) + '" data-title="' + escapeHtml(doc.title) + '">' +
        '<div class="doc-card-avatar">' + genderEmoji + '</div>' +
        '<div class="doc-card-info">' +
        '<div class="doc-card-name">' + escapeHtml(doc.doctor_name) + '</div>' +
        '<div class="doc-card-title">' + escapeHtml(doc.title) + '</div>' +
        (doc.specialty ? '<div class="doc-card-spec">✦ ' + escapeHtml(doc.specialty) + '</div>' : '') +
        '</div>' +
        '<div class="doc-card-check">✓</div>' +
        '</div>';
    });

    if (deptInfo && deptInfo.dept_intro) {
      html += '<div class="doctor-cards-dept-intro">' + escapeHtml(deptInfo.dept_name) + '：' + escapeHtml(deptInfo.dept_intro) + '</div>';
    }

    doctorCards.innerHTML = html;

    // 绑定点击事件
    doctorCards.querySelectorAll('.doc-card').forEach(function (card) {
      card.onclick = function () {
        doctorCards.querySelectorAll('.doc-card').forEach(function (c) { c.classList.remove('doc-card--selected'); });
        card.classList.add('doc-card--selected');
        doctorCards.classList.add('doctor-cards--has-selected');
        selectedDoctorId = card.getAttribute('data-doctor-id');

        // 显示医生简介
        var docName = card.querySelector('.doc-card-name').textContent;
        var docTitle = card.getAttribute('data-title');
        var docSpec = card.querySelector('.doc-card-spec');
        var specText = docSpec ? docSpec.textContent : '暂无擅长方向信息';
        doctorIntro.innerHTML =
          '<div class="doctor-intro-card">' +
          '<span class="doctor-intro-name">已选：' + escapeHtml(docName) + ' · ' + escapeHtml(docTitle) + '</span>' +
          '<span class="doctor-spec-text">' + escapeHtml(specText) + '</span>' +
          '</div>';
        doctorIntro.classList.remove('is-hidden');

        // 刷新号源
        refreshQuotaInfo();
      };
    });
  }

  /* ===== 查询号源信息 ===== */
  function refreshQuotaInfo() {
    if (!selectedDoctorId) {
      quotaInfo.classList.add('is-hidden');
      return;
    }
    var today = new Date().toISOString().slice(0, 10);
    var rtVal = document.getElementById('rt-local').value;
    var selectedDate = rtVal ? rtVal.slice(0, 10) : today;

    api('/schedules?date=' + selectedDate)
      .then(function (rows) {
        var found = Array.isArray(rows) ? rows.find(function (r) { return r.doctor_id === selectedDoctorId; }) : null;
        quotaInfo.classList.remove('is-hidden');
        if (!found) {
          quotaInfo.innerHTML = '<span class="quota-badge quota-none">今日该医生暂无排班号源信息</span>';
          return;
        }
        var used = Number(found.used_quota);
        var total = Number(found.total_quota);
        var remain = Number(found.remain_quota);
        var cls = remain > 5 ? 'quota-ok' : remain > 0 ? 'quota-warn' : 'quota-full';
        quotaInfo.innerHTML =
          '<span class="quota-badge ' + cls + '">' +
          '📋 ' + selectedDate + ' 号源：已用 ' + used + ' / 共 ' + total +
          '（剩余 <strong>' + remain + '</strong>）' +
          (remain === 0 ? ' — 号源已满，请勾选加急' : '') +
          '</span>';
        if (remain === 0) {
          document.getElementById('chk-urgent').checked = true;
        }
      })
      .catch(function () {
        quotaInfo.classList.add('is-hidden');
      });
  }

  function loadMasters() {
    return Promise.all([api('/departments'), api('/doctors')])
      .then(function (results) {
        departments = Array.isArray(results[0]) ? results[0] : [];
        doctors = Array.isArray(results[1]) ? results[1] : [];
        fillDeptSelect();
        renderDoctorCards(selDept.value);
      })
      .catch(function (e) {
        setMsg(msg, '加载科室/医生列表失败：' + e.message, true);
      });
  }

  function toMysqlDateTime(localVal) {
    if (!localVal || !String(localVal).trim()) return null;
    var s = String(localVal).trim();
    return s.replace('T', ' ') + (s.length === 16 ? ':00' : '');
  }

  function generateRegId() {
    var d = new Date();
    var y = String(d.getFullYear()).slice(-2);
    var m = pad2(d.getMonth() + 1);
    var day = pad2(d.getDate());
    var rand = String(Math.floor(Math.random() * 900) + 100);
    return 'REG' + y + m + day + rand;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  /* ===== 身份证号仿真生成 ===== */
  function calcIdCheckDigit(id17) {
    var weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    var checkMap = '10X98765432';
    var sum = 0;
    for (var i = 0; i < 17; i++) {
      sum += parseInt(id17[i]) * weights[i];
    }
    return checkMap[sum % 11];
  }

  function generateIdCard(gender) {
    // 广东地区440开头，可随机选广州各区
    var areaCodes = ['440103', '440104', '440105', '440106', '440111', '440112', '440113'];
    var areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];

    // 随机出生日期：1970-2005
    var year = 1970 + Math.floor(Math.random() * 36);
    var month = pad2(1 + Math.floor(Math.random() * 12));
    var maxDay = new Date(year, parseInt(month), 0).getDate();
    var day = pad2(1 + Math.floor(Math.random() * maxDay));
    var birthPart = String(year) + month + day;

    // 顺序码：奇数男，偶数女
    var seq;
    if (gender === '女') {
      seq = String(Math.floor(Math.random() * 50) * 2).padStart(3, '0'); // 000-098 偶数
    } else {
      seq = String(Math.floor(Math.random() * 50) * 2 + 1).padStart(3, '0'); // 001-099 奇数
    }

    var id17 = areaCode + birthPart + seq;
    var checkDigit = calcIdCheckDigit(id17);
    return id17 + checkDigit;
  }

  document.getElementById('btn-gen-idcard').onclick = function () {
    var gender = document.getElementById('patient-gender').value || '男';
    var idCard = generateIdCard(gender);
    document.getElementById('id-card').value = idCard;

    // 自动从身份证号提取出生日期
    var birth = idCard.substring(6, 14);
    var birthStr = birth.substring(0, 4) + '-' + birth.substring(4, 6) + '-' + birth.substring(6, 8);
    document.getElementById('patient-birth').value = birthStr;
  };

  /* ===== 摄像头拍照 + 模拟身份识别 ===== */
  var cameraVideo = document.getElementById('camera-video');
  var cameraCanvas = document.getElementById('camera-canvas');
  var cameraPanel = document.getElementById('camera-panel');
  var cameraPreview = document.getElementById('camera-preview');
  var cameraImg = document.getElementById('camera-img');
  var cameraStatus = document.getElementById('camera-status');

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (t) { t.stop(); });
      cameraStream = null;
    }
    cameraVideo.srcObject = null;
    cameraPanel.classList.add('is-hidden');
    cameraPreview.classList.add('is-hidden');
    document.getElementById('btn-open-camera').classList.remove('is-hidden');
  }

  document.getElementById('btn-open-camera').onclick = function () {
    if (cameraStream) {
      stopCamera();
      return;
    }
    document.getElementById('btn-open-camera').classList.add('is-hidden');
    cameraPanel.classList.remove('is-hidden');
    cameraPreview.classList.add('is-hidden');
    cameraStatus.textContent = '';

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } })
      .then(function (stream) {
        cameraStream = stream;
        cameraVideo.srcObject = stream;
        cameraVideo.play();
      })
      .catch(function () {
        // 降级：尝试默认摄像头
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(function (stream) {
            cameraStream = stream;
            cameraVideo.srcObject = stream;
            cameraVideo.play();
          })
          .catch(function (e) {
            setMsg(msg, '无法访问摄像头：' + e.message, true);
            stopCamera();
          });
      });
  };

  document.getElementById('btn-close-camera').onclick = function () {
    stopCamera();
  };

  /* ===== 真实 OCR 身份证识别（Tesseract.js） ===== */
  function parseIdCardText(text) {
    var cleaned = text.replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5\dXx：:，,\n]/g, '');
    var result = { name: null, gender: null, idCard: null, birth: null, rawText: cleaned };

    // 1. 查找"姓名"后的中文名
    var nameMatch1 = cleaned.match(/姓名[：:]*([\u4e00-\u9fa5]{2,4})/);
    if (nameMatch1) result.name = nameMatch1[1];

    // 2. 查找"性别"后的性别
    var genderMatch = cleaned.match(/性别[：:]*([男女])/);
    if (genderMatch) result.gender = genderMatch[1];

    // 3. 查找 18 位身份证号
    var idMatch = cleaned.match(/(\d{17}[\dXx])/);
    if (idMatch) {
      result.idCard = idMatch[1].toUpperCase();
      // 从身份证号提取出生日期
      var b = result.idCard.substring(6, 14);
      result.birth = b.substring(0, 4) + '-' + b.substring(4, 6) + '-' + b.substring(6, 8);
      // 从身份证号推断性别（第17位：奇数男，偶数女）
      if (!result.gender) {
        var gd = parseInt(result.idCard.charAt(16));
        if (!isNaN(gd)) result.gender = gd % 2 === 1 ? '男' : '女';
      }
    }

    // 4. 查找"出生"后的日期
    var birthMatch = cleaned.match(/出生[：:]*(\d{4})[年\s]*(\d{1,2})[月\s]*(\d{1,2})/);
    if (birthMatch && !result.birth) {
      result.birth = birthMatch[1] + '-' + String(birthMatch[2]).padStart(2, '0') + '-' + String(birthMatch[3]).padStart(2, '0');
    }

    // 5. 如果没有通过标签找到姓名，尝试提取开头的2-3个中文字符
    if (!result.name) {
      var nameMatch2 = cleaned.match(/^[\u4e00-\u9fa5]{2,3}/);
      if (nameMatch2) result.name = nameMatch2[0];
    }

    return result;
  }

  async function runOcrAndFillForm(imageDataUrl) {
    var statusEl = cameraStatus;
    statusEl.textContent = '正在加载 OCR 引擎（首次需下载中文语言包约 10MB）…';
    statusEl.className = 'camera-recog-status camera-recog-loading';

    try {
      var worker = await Tesseract.createWorker('chi_sim', 1, {
        logger: function (m) {
          if (m.status === 'recognizing text') {
            statusEl.textContent = '正在识别文字… ' + Math.round(m.progress * 100) + '%';
          } else if (m.status === 'loading language traineddata') {
            statusEl.textContent = '下载中文语言包… ' + Math.round(m.progress * 100) + '%';
          } else if (m.status === 'initializing api') {
            statusEl.textContent = '初始化 OCR 引擎…';
          } else if (m.status === 'loading tesseract core') {
            statusEl.textContent = '加载 Tesseract 核心… ' + Math.round(m.progress * 100) + '%';
          }
        }
      });

      var ocrResult = await worker.recognize(imageDataUrl);
      await worker.terminate();

      var text = ocrResult.data.text;
      console.log('[OCR 原始识别结果]', text);

      var parsed = parseIdCardText(text);

      if (parsed.name) document.getElementById('patient-name').value = parsed.name;
      if (parsed.gender) document.getElementById('patient-gender').value = parsed.gender;
      if (parsed.idCard) {
        document.getElementById('id-card').value = parsed.idCard;
        if (parsed.birth) document.getElementById('patient-birth').value = parsed.birth;
      }

      var found = [];
      if (parsed.name) found.push('姓名：' + parsed.name);
      if (parsed.gender) found.push('性别：' + parsed.gender);
      if (parsed.idCard) found.push('身份证号：' + parsed.idCard);

      if (found.length > 0) {
        statusEl.textContent = '识别完成 ✓  ' + found.join('  ');
        statusEl.className = 'camera-recog-status camera-recog-done';
      } else {
        statusEl.textContent = '未识别到有效信息，请确保照片清晰、正对身份证拍摄。检测到文本：' + (text.trim().substring(0, 60) || '(空)');
        statusEl.className = 'camera-recog-status camera-recog-warn';
      }

      setTimeout(function () { cameraPreview.classList.add('is-hidden'); }, 5000);

    } catch (err) {
      console.error('OCR 错误：', err);
      statusEl.textContent = '识别失败：' + (err.message || '网络问题') + '。请检查网络后重试，或手动填写。';
      statusEl.className = 'camera-recog-status camera-recog-warn';
      setTimeout(function () { cameraPreview.classList.add('is-hidden'); }, 5000);
    }
  }

  /* ===== 上传照片识别 ===== */
  var filePhotoInput = document.getElementById('file-photo-input');

  document.getElementById('btn-upload-photo').onclick = function () {
    filePhotoInput.value = '';
    filePhotoInput.click();
  };

  filePhotoInput.addEventListener('change', function () {
    var file = filePhotoInput.files[0];
    if (!file) return;
    if (!file.type.match(/^image\//)) {
      setMsg(msg, '请选择图片文件', true);
      return;
    }

    // 显示上传的照片预览
    var reader = new FileReader();
    reader.onload = function (e) {
      cameraImg.src = e.target.result;
      cameraPreview.classList.remove('is-hidden');
      cameraPanel.classList.remove('is-hidden');

      // 真实 OCR 识别
      runOcrAndFillForm(e.target.result);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-capture').onclick = function () {
    if (!cameraStream) return;
    cameraCanvas.width = cameraVideo.videoWidth || 640;
    cameraCanvas.height = cameraVideo.videoHeight || 480;
    var ctx = cameraCanvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
    var dataUrl = cameraCanvas.toDataURL('image/jpeg', 0.85);
    cameraImg.src = dataUrl;
    cameraPreview.classList.remove('is-hidden');

    // 真实 OCR 识别
    runOcrAndFillForm(dataUrl);
  };

  /* ===== 智能推荐科室 ===== */
  document.getElementById('btn-recommend').onclick = function () {
    var desc = document.getElementById('symptom-input').value.trim();
    if (!desc) {
      var box = document.getElementById('recommend-result');
      box.classList.remove('is-hidden');
      box.innerHTML = '<p class="hint" style="margin:0">请先在上方输入病情描述。</p>';
      return;
    }
    var btn = this;
    btn.disabled = true;
    btn.textContent = '推荐中…';
    api('/recommend-dept', {
      method: 'POST',
      body: JSON.stringify({ description: desc }),
    })
      .then(function (data) {
        btn.disabled = false;
        btn.textContent = '🔍 智能推荐科室';
        var box = document.getElementById('recommend-result');
        box.classList.remove('is-hidden');
        if (!data.results || data.results.length === 0) {
          box.innerHTML = '<p class="hint" style="margin:0">' +
            (data.message || '暂无推荐，请咨询导诊台') + '</p>';
          return;
        }
        var html = '<p class="recommend-title">根据症状推荐以下科室（点击可快速选择）：</p><div class="recommend-cards">';
        data.results.forEach(function (r, i) {
          var badge = i === 0 ? '<span class="rec-badge">最匹配</span>' : '';
          html += '<div class="rec-card" data-dept-name="' + escapeHtml(r.dept_name) + '" data-dept-id="' + escapeHtml(r.dept_id || '') + '">' +
            badge +
            '<div class="rec-dept-name">' + escapeHtml(r.dept_name) + '</div>' +
            (r.dept_intro ? '<div class="rec-dept-intro">' + escapeHtml(r.dept_intro) + '</div>' : '') +
            '</div>';
        });
        html += '</div>';
        if (data.message) html += '<p class="hint" style="margin:4px 0 0">' + escapeHtml(data.message) + '</p>';
        box.innerHTML = html;

        box.querySelectorAll('.rec-card').forEach(function (card) {
          card.onclick = function () {
            var deptId = card.getAttribute('data-dept-id');
            var deptName = card.getAttribute('data-dept-name');
            var found = departments.find(function (d) { return d.dept_name === deptName || d.dept_id === deptId; });
            if (found) {
              selDept.value = found.dept_id;
              renderDoctorCards(found.dept_id);
              selDept.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
            box.querySelectorAll('.rec-card').forEach(function (c) { c.classList.remove('rec-card--selected'); });
            card.classList.add('rec-card--selected');
          };
        });
      })
      .catch(function (e) {
        btn.disabled = false;
        btn.textContent = '🔍 智能推荐科室';
        var box = document.getElementById('recommend-result');
        box.classList.remove('is-hidden');
        box.innerHTML = '<p class="msg is-error" style="margin:0">' + escapeHtml(e.message) + '</p>';
      });
  };

  /* ===== 科室/医生联动 ===== */
  selDept.addEventListener('change', function () {
    renderDoctorCards(selDept.value);
  });

  document.getElementById('rt-local').addEventListener('change', function () {
    if (selectedDoctorId) refreshQuotaInfo();
  });

  document.getElementById('btn-gen-id').onclick = function () {
    document.getElementById('rid').value = generateRegId();
  };

  document.getElementById('btn-show-new').onclick = function () {
    hidePanels();
    panelNew.classList.remove('is-hidden');
    loadMasters().then(function () {
      document.getElementById('rid').value = generateRegId();
      // 自动生成身份证号
      if (!document.getElementById('id-card').value) {
        document.getElementById('id-card').value = generateIdCard('男');
      }
    });
  };

  document.getElementById('btn-close-new').onclick = hidePanels;

  document.getElementById('btn-show-status').onclick = function () {
    hidePanels();
    panelStatus.classList.remove('is-hidden');
    document.getElementById('status-change').focus();
  };

  document.getElementById('btn-close-status').onclick = hidePanels;

  document.getElementById('btn-form-reset').addEventListener('click', function () {
    setTimeout(function () {
      renderDoctorCards(selDept.value);
      quotaInfo.classList.add('is-hidden');
      doctorIntro.classList.add('is-hidden');
      selectedDoctorId = null;
      document.getElementById('recommend-result').classList.add('is-hidden');
      document.getElementById('rid').value = generateRegId();
      document.getElementById('id-card').value = generateIdCard('男');
      stopCamera();
    }, 0);
  });

  /* ===== 提交挂号 ===== */
  document.getElementById('btn-submit').onclick = function () {
    var reg_id = document.getElementById('rid').value.trim();
    var patient_name = document.getElementById('patient-name').value.trim();
    var patient_gender = document.getElementById('patient-gender').value;
    var patient_birth = document.getElementById('patient-birth').value;
    var patient_history = document.getElementById('patient-history').value.trim();
    var patient_phone = document.getElementById('patient-phone').value.trim();
    var id_card = document.getElementById('id-card').value.trim();
    var dept_id = selDept.value;
    var visit_status = '未就诊';
    var is_urgent = document.getElementById('chk-urgent').checked;
    var reg_time = toMysqlDateTime(document.getElementById('rt-local').value);

    // 校验
    if (!id_card || id_card.length !== 18) { setMsg(msg, '请填写18位身份证号码', true); return; }
    if (!patient_name) { setMsg(msg, '请填写患者姓名', true); return; }
    if (!patient_gender) { setMsg(msg, '请选择性别', true); return; }
    if (!patient_birth) { setMsg(msg, '请选择出生日期', true); return; }
    if (!dept_id) { setMsg(msg, '请选择科室', true); return; }
    if (!selectedDoctorId) { setMsg(msg, '请在科室下方卡片中选择一位医生', true); return; }
    if (!reg_id) { setMsg(msg, '请填写或生成挂号编号', true); return; }

    // 先查找或创建患者
    api('/patients/find-or-create', {
      method: 'POST',
      body: JSON.stringify({
        patient_name: patient_name,
        gender: patient_gender,
        birth_date: patient_birth,
        medical_history: patient_history || null,
        id_card: id_card,
        phone: patient_phone || null,
      }),
    })
      .then(function (patientResult) {
        var pid = patientResult.patient.patient_id;

        // 创建挂号
        return api('/registrations', {
          method: 'POST',
          body: JSON.stringify({
            reg_id: reg_id,
            patient_id: pid,
            doctor_id: selectedDoctorId,
            visit_status: visit_status,
            reg_time: reg_time,
            is_urgent: is_urgent,
          }),
        }).then(function (data) {
          return { data: data, patientResult: patientResult };
        });
      })
      .then(function (result) {
        var data = result.data;
        var patientResult = result.patientResult;
        var msgText = is_urgent ? '加急挂号已保存' : '挂号已保存（状态：未就诊）';
        if (patientResult.created) {
          msgText += '（已自动建档：' + escapeHtml(patientResult.patient.patient_id) + '）';
        }
        setMsg(msg, msgText, false);

        document.getElementById('reg-form').reset();
        document.getElementById('st').value = '未就诊';
        document.getElementById('recommend-result').classList.add('is-hidden');
        quotaInfo.classList.add('is-hidden');
        doctorIntro.classList.add('is-hidden');
        selectedDoctorId = null;
        renderDoctorCards('');
        hidePanels();

        if (data.row) {
          var i = regCache.findIndex(function (r) { return r.reg_id === data.row.reg_id; });
          if (i >= 0) regCache[i] = data.row;
          else regCache.push(data.row);
          renderTable();
          var wrap = document.querySelector('.table-wrap');
          if (wrap) wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  };

  document.getElementById('btn-apply-status').onclick = function () {
    if (!selectedId) { setMsg(msg, '请先在表格中选中一条挂号记录', true); return; }
    var visit_status = document.getElementById('status-change').value;
    api('/registrations/' + encodeURIComponent(selectedId) + '/status', {
      method: 'PATCH',
      body: JSON.stringify({ visit_status: visit_status }),
    })
      .then(function () {
        setMsg(msg, '状态已更新为「' + visit_status + '」', false);
        hidePanels();
        regCache.forEach(function (r) { if (r.reg_id === selectedId) r.visit_status = visit_status; });
        renderTable();
      })
      .catch(function (e) { setMsg(msg, e.message, true); });
  };

  load();
})();
