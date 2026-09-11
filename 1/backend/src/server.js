const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS 白名单配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Auth-Token'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get(
  '/api/health',
  asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  }),
);

app.post(
  '/api/login',
  asyncHandler(async (req, res) => {
    const { account, password } = req.body || {};
    if (!account || password === undefined || password === null) {
      return res.status(400).json({ error: '请填写账号和密码' });
    }
    const hash = sha256Hex(password);
    const [rows] = await pool.query(
      'SELECT account, perm_type FROM admin_user WHERE account = ? AND password_hash = ? LIMIT 1',
      [account, hash],
    );
    if (!rows.length) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    // 使用 cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');
    res.json({ ok: true, token, account: rows[0].account, perm_type: rows[0].perm_type });
  }),
);

/* ---------- department ---------- */
app.get(
  '/api/departments',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT dept_id, dept_name, dept_intro FROM department ORDER BY dept_id',
    );
    res.json(rows);
  }),
);

app.post(
  '/api/departments',
  asyncHandler(async (req, res) => {
    const { dept_id, dept_name, dept_intro } = req.body || {};
    if (!dept_id || !dept_name) {
      return res.status(400).json({ error: '科室编号与科室名称为必填' });
    }
    await pool.query(
      'INSERT INTO department (dept_id, dept_name, dept_intro) VALUES (?, ?, ?)',
      [dept_id, dept_name, dept_intro ?? null],
    );
    const [inserted] = await pool.query(
      'SELECT dept_id, dept_name, dept_intro FROM department WHERE dept_id = ?',
      [dept_id],
    );
    res.status(201).json({ ok: true, row: inserted[0] });
  }),
);

app.put(
  '/api/departments/:dept_id',
  asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    const { dept_name, dept_intro } = req.body || {};
    if (!dept_name) {
      return res.status(400).json({ error: '科室名称为必填' });
    }
    const [r] = await pool.query(
      'UPDATE department SET dept_name = ?, dept_intro = ? WHERE dept_id = ?',
      [dept_name, dept_intro ?? null, dept_id],
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '未找到该科室' });
    }
    res.json({ ok: true });
  }),
);

app.delete(
  '/api/departments/:dept_id',
  asyncHandler(async (req, res) => {
    const { dept_id } = req.params;
    try {
      const [r] = await pool.query('DELETE FROM department WHERE dept_id = ?', [dept_id]);
      if (r.affectedRows === 0) {
        return res.status(404).json({ error: '未找到该科室' });
      }
      res.json({ ok: true });
    } catch (e) {
      if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451) {
        return res.status(409).json({ error: '该科室下仍有医生或其他关联数据，无法删除' });
      }
      throw e;
    }
  }),
);

/* ---------- doctor ---------- */
app.get(
  '/api/doctors',
  asyncHandler(async (req, res) => {
    const deptId = req.query.dept_id;
    let sql =
      'SELECT doctor_id, doctor_name, gender, title, dept_id, specialty FROM doctor';
    const params = [];
    if (deptId) {
      sql += ' WHERE dept_id = ?';
      params.push(deptId);
    }
    sql += ' ORDER BY doctor_id';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  }),
);

app.post(
  '/api/doctors',
  asyncHandler(async (req, res) => {
    const { doctor_id, doctor_name, gender, title, dept_id, specialty } = req.body || {};
    if (!doctor_id || !doctor_name || !gender || !title || !dept_id) {
      return res.status(400).json({ error: '医生编号、姓名、性别、职称、科室编号为必填' });
    }
    if (!['男', '女'].includes(gender)) {
      return res.status(400).json({ error: '性别须为「男」或「女」' });
    }
    await pool.query(
      'INSERT INTO doctor (doctor_id, doctor_name, gender, title, dept_id, specialty) VALUES (?, ?, ?, ?, ?, ?)',
      [doctor_id, doctor_name, gender, title, dept_id, specialty ?? null],
    );
    const [inserted] = await pool.query(
      'SELECT doctor_id, doctor_name, gender, title, dept_id, specialty FROM doctor WHERE doctor_id = ?',
      [doctor_id],
    );
    res.status(201).json({ ok: true, row: inserted[0] });
  }),
);

app.put(
  '/api/doctors/:doctor_id',
  asyncHandler(async (req, res) => {
    const { doctor_id } = req.params;
    const { doctor_name, gender, title, dept_id, specialty } = req.body || {};
    if (!doctor_name || !gender || !title || !dept_id) {
      return res.status(400).json({ error: '姓名、性别、职称、科室编号为必填' });
    }
    if (!['男', '女'].includes(gender)) {
      return res.status(400).json({ error: '性别须为「男」或「女」' });
    }
    const [r] = await pool.query(
      'UPDATE doctor SET doctor_name = ?, gender = ?, title = ?, dept_id = ?, specialty = ? WHERE doctor_id = ?',
      [doctor_name, gender, title, dept_id, specialty ?? null, doctor_id],
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '未找到该医生' });
    }
    res.json({ ok: true });
  }),
);

app.delete(
  '/api/doctors/:doctor_id',
  asyncHandler(async (req, res) => {
    const { doctor_id } = req.params;
    try {
      const [r] = await pool.query('DELETE FROM doctor WHERE doctor_id = ?', [doctor_id]);
      if (r.affectedRows === 0) {
        return res.status(404).json({ error: '未找到该医生' });
      }
      res.json({ ok: true });
    } catch (e) {
      if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451) {
        return res.status(409).json({ error: '该医生仍有挂号记录，无法删除' });
      }
      throw e;
    }
  }),
);

/* ---------- patient ---------- */
app.get(
  '/api/patients',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT patient_id, patient_name, gender, age, phone, birth_date, medical_history, id_card FROM patient ORDER BY patient_id',
    );
    res.json(rows);
  }),
);

app.post(
  '/api/patients',
  asyncHandler(async (req, res) => {
    const { patient_id, patient_name, gender, age, phone, birth_date, medical_history, id_card } = req.body || {};
    if (!patient_id || !patient_name || !gender || age === undefined || !phone) {
      return res.status(400).json({ error: '患者编号、姓名、性别、年龄、电话为必填' });
    }
    await pool.query(
      'INSERT INTO patient (patient_id, patient_name, gender, age, phone, birth_date, medical_history, id_card) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, patient_name, gender, Number(age), phone, birth_date || null, medical_history || null, id_card || null],
    );
    const [inserted] = await pool.query(
      'SELECT patient_id, patient_name, gender, age, phone, birth_date, medical_history, id_card FROM patient WHERE patient_id = ?',
      [patient_id],
    );
    res.status(201).json({ ok: true, row: inserted[0] });
  }),
);

app.put(
  '/api/patients/:patient_id',
  asyncHandler(async (req, res) => {
    const { patient_id } = req.params;
    const { patient_name, gender, age, phone, birth_date, medical_history, id_card } = req.body || {};
    if (!patient_name || !gender || age === undefined || !phone) {
      return res.status(400).json({ error: '姓名、性别、年龄、电话为必填' });
    }
    const [r] = await pool.query(
      'UPDATE patient SET patient_name = ?, gender = ?, age = ?, phone = ?, birth_date = ?, medical_history = ?, id_card = ? WHERE patient_id = ?',
      [patient_name, gender, Number(age), phone, birth_date || null, medical_history || null, id_card || null, patient_id],
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '未找到该患者' });
    }
    res.json({ ok: true });
  }),
);

app.delete(
  '/api/patients/:patient_id',
  asyncHandler(async (req, res) => {
    const { patient_id } = req.params;
    try {
      const [r] = await pool.query('DELETE FROM patient WHERE patient_id = ?', [patient_id]);
      if (r.affectedRows === 0) {
        return res.status(404).json({ error: '未找到该患者' });
      }
      res.json({ ok: true });
    } catch (e) {
      if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451) {
        return res.status(409).json({ error: '该患者仍有挂号记录，无法删除' });
      }
      throw e;
    }
  }),
);

// 挂号时自动查找或创建患者
app.post(
  '/api/patients/find-or-create',
  asyncHandler(async (req, res) => {
    const { patient_name, gender, birth_date, medical_history, id_card, phone: reqPhone } = req.body || {};
    if (!patient_name || !gender || !id_card) {
      return res.status(400).json({ error: '姓名、性别、身份证号为必填' });
    }

    // 先按身份证号查找已有患者
    const [[existing]] = await pool.query(
      'SELECT patient_id, patient_name, gender, age, phone, birth_date, medical_history, id_card FROM patient WHERE id_card = ? LIMIT 1',
      [id_card]
    );

    if (existing) {
      return res.json({ created: false, patient: existing });
    }

    // 生成患者编号：P + 年月日 + 3位序号
    const now = new Date();
    const datePart = String(now.getFullYear()).slice(2) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');

    // 查询当日已有患者数，生成序号
    const [[{ cnt }]] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM patient WHERE patient_id LIKE ?',
      ['P' + datePart + '%']
    );
    const seq = String(cnt + 1).padStart(3, '0');
    const patient_id = 'P' + datePart + seq;

    // 计算年龄
    const age = birth_date
      ? Math.floor((new Date() - new Date(birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;

    // 使用用户提供的电话
    const phone = reqPhone && String(reqPhone).trim()
      ? String(reqPhone).trim()
      : '138' + String(Math.floor(Math.random() * 90000000 + 10000000));

    await pool.query(
      'INSERT INTO patient (patient_id, patient_name, gender, age, phone, birth_date, medical_history, id_card) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, patient_name, gender, age, phone, birth_date || null, medical_history || null, id_card]
    );

    const [[created]] = await pool.query(
      'SELECT patient_id, patient_name, gender, age, phone, birth_date, medical_history, id_card FROM patient WHERE patient_id = ?',
      [patient_id]
    );

    res.status(201).json({ created: true, patient: created });
  }),
);

/* ---------- registration ---------- */
app.get(
  '/api/registrations',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
      SELECT
        r.reg_id,
        r.reg_time,
        r.visit_status,
        r.is_urgent,
        r.patient_id,
        p.patient_name,
        r.doctor_id,
        doc.doctor_name,
        dep.dept_name
      FROM registration r
      JOIN patient p ON p.patient_id = r.patient_id
      JOIN doctor doc ON doc.doctor_id = r.doctor_id
      JOIN department dep ON dep.dept_id = doc.dept_id
      ORDER BY r.reg_time DESC, r.reg_id
    `);
    res.json(rows);
  }),
);

app.post(
  '/api/registrations',
  asyncHandler(async (req, res) => {
    const { reg_id, patient_id, doctor_id, visit_status, reg_time, is_urgent } = req.body || {};
    if (!reg_id || !patient_id || !doctor_id) {
      return res.status(400).json({ error: '挂号编号、患者编号、医生编号为必填' });
    }
    const status = visit_status || '未就诊';
    const urgent = is_urgent ? 1 : 0;
    const rt =
      reg_time && String(reg_time).trim() !== '' ? String(reg_time).trim() : null;

    // 号源检查：非加急挂号需检查号源是否充足
    const regDate = rt ? rt.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const [[scheduleRow]] = await pool.query(
      'SELECT sched_id, total_quota, used_quota FROM daily_schedule WHERE doctor_id = ? AND sched_date = ? LIMIT 1',
      [doctor_id, regDate]
    );
    // 非加急必须检查排班和号源
    if (!urgent) {
      if (!scheduleRow) {
        return res.status(409).json({ error: '该医生当日未安排排班，请选择加急或其他医生' });
      }
      if (scheduleRow.used_quota >= scheduleRow.total_quota) {
        return res.status(409).json({ error: '当日号源已满，请选择加急或其他医生' });
      }
      // 原子更新号源（避免竞态）
      const [updateResult] = await pool.query(
        'UPDATE daily_schedule SET used_quota = used_quota + 1 WHERE sched_id = ? AND used_quota < total_quota',
        [scheduleRow.sched_id]
      );
      if (updateResult.affectedRows === 0) {
        return res.status(409).json({ error: '号源已被抢光，请选择加急或其他医生' });
      }
    }

    await pool.query(
      `INSERT INTO registration (reg_id, patient_id, doctor_id, reg_time, visit_status, is_urgent)
       VALUES (?, ?, ?, COALESCE(?, NOW()), ?, ?)`,
      [reg_id, patient_id, doctor_id, rt, status, urgent],
    );
    const [rows] = await pool.query(
      `
      SELECT
        r.reg_id,
        r.reg_time,
        r.visit_status,
        r.is_urgent,
        r.patient_id,
        p.patient_name,
        r.doctor_id,
        doc.doctor_name,
        dep.dept_name
      FROM registration r
      JOIN patient p ON p.patient_id = r.patient_id
      JOIN doctor doc ON doc.doctor_id = r.doctor_id
      JOIN department dep ON dep.dept_id = doc.dept_id
      WHERE r.reg_id = ?
    `,
      [reg_id],
    );
    res.status(201).json({ ok: true, row: rows[0] });
  }),
);

app.patch(
  '/api/registrations/:reg_id/status',
  asyncHandler(async (req, res) => {
    const { reg_id } = req.params;
    const { visit_status } = req.body || {};
    if (!visit_status) {
      return res.status(400).json({ error: '请提供就诊状态' });
    }
    const [r] = await pool.query(
      'UPDATE registration SET visit_status = ? WHERE reg_id = ?',
      [visit_status, reg_id],
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '未找到该挂号记录' });
    }
    res.json({ ok: true });
  }),
);

app.delete(
  '/api/registrations/:reg_id',
  asyncHandler(async (req, res) => {
    const { reg_id } = req.params;
    const [r] = await pool.query('DELETE FROM registration WHERE reg_id = ?', [reg_id]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: '未找到该挂号记录' });
    }
    res.json({ ok: true });
  }),
);

/* ---------- statistics ---------- */
app.get(
  '/api/statistics/summary',
  asyncHandler(async (req, res) => {
    const [[totalRow]] = await pool.query('SELECT COUNT(*) AS n FROM registration');
    const [[pending]] = await pool.query(
      "SELECT COUNT(*) AS n FROM registration WHERE visit_status = '未就诊'",
    );
    const [[visited]] = await pool.query(
      "SELECT COUNT(*) AS n FROM registration WHERE visit_status = '已就诊'",
    );
    const [[cancelled]] = await pool.query(
      "SELECT COUNT(*) AS n FROM registration WHERE visit_status = '已取消'",
    );
    res.json({
      total: Number(totalRow.n),
      pending: Number(pending.n),
      visited: Number(visited.n),
      cancelled: Number(cancelled.n),
    });
  }),
);

app.get(
  '/api/statistics/by-dept',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
      SELECT dep.dept_id, dep.dept_name, COUNT(r.reg_id) AS reg_count
      FROM department dep
      LEFT JOIN doctor doc ON doc.dept_id = dep.dept_id
      LEFT JOIN registration r ON r.doctor_id = doc.doctor_id
      GROUP BY dep.dept_id, dep.dept_name
      ORDER BY reg_count DESC, dep.dept_id
    `);
    res.json(rows.map((x) => ({ ...x, reg_count: Number(x.reg_count) })));
  }),
);

app.use((err, req, res, next) => {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: '主键或唯一约束冲突，编号或电话可能已存在' });
  }
  console.error(err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

/* ---------- daily_schedule 每日号源 ---------- */

// 查询号源列表（可按日期过滤）
app.get(
  '/api/schedules',
  asyncHandler(async (req, res) => {
    const { date } = req.query;
    let sql = `
      SELECT
        ds.sched_id,
        ds.doctor_id,
        doc.doctor_name,
        dep.dept_name,
        ds.sched_date,
        ds.total_quota,
        ds.used_quota,
        (ds.total_quota - ds.used_quota) AS remain_quota
      FROM daily_schedule ds
      JOIN doctor doc ON doc.doctor_id = ds.doctor_id
      JOIN department dep ON dep.dept_id = doc.dept_id
    `;
    const params = [];
    if (date) {
      sql += ' WHERE ds.sched_date = ?';
      params.push(date);
    }
    sql += ' ORDER BY ds.sched_date DESC, dep.dept_name, doc.doctor_name';
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(r => ({ ...r, remain_quota: Number(r.remain_quota) })));
  }),
);

// 新增号源
app.post(
  '/api/schedules',
  asyncHandler(async (req, res) => {
    const { doctor_id, sched_date, total_quota } = req.body || {};
    if (!doctor_id || !sched_date || total_quota === undefined) {
      return res.status(400).json({ error: '医生编号、排班日期、总号源数为必填' });
    }
    const quota = Number(total_quota);
    if (!Number.isInteger(quota) || quota < 1 || quota > 200) {
      return res.status(400).json({ error: '总号源数须为 1–200 的整数' });
    }
    const [r] = await pool.query(
      'INSERT INTO daily_schedule (doctor_id, sched_date, total_quota, used_quota) VALUES (?, ?, ?, 0)',
      [doctor_id, sched_date, quota]
    );
    const [[row]] = await pool.query(
      `SELECT ds.sched_id, ds.doctor_id, doc.doctor_name, dep.dept_name,
              ds.sched_date, ds.total_quota, ds.used_quota
       FROM daily_schedule ds
       JOIN doctor doc ON doc.doctor_id = ds.doctor_id
       JOIN department dep ON dep.dept_id = doc.dept_id
       WHERE ds.sched_id = ?`,
      [r.insertId]
    );
    res.status(201).json({ ok: true, row });
  }),
);

// 修改号源总数
app.put(
  '/api/schedules/:sched_id',
  asyncHandler(async (req, res) => {
    const { sched_id } = req.params;
    const { total_quota } = req.body || {};
    if (total_quota === undefined) {
      return res.status(400).json({ error: '请提供 total_quota' });
    }
    const quota = Number(total_quota);
    if (!Number.isInteger(quota) || quota < 1 || quota > 200) {
      return res.status(400).json({ error: '总号源数须为 1–200 的整数' });
    }
    const [r] = await pool.query(
      'UPDATE daily_schedule SET total_quota = ? WHERE sched_id = ?',
      [quota, sched_id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: '未找到该排班记录' });
    res.json({ ok: true });
  }),
);

// 删除号源记录
app.delete(
  '/api/schedules/:sched_id',
  asyncHandler(async (req, res) => {
    const { sched_id } = req.params;
    const [r] = await pool.query('DELETE FROM daily_schedule WHERE sched_id = ?', [sched_id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: '未找到该排班记录' });
    res.json({ ok: true });
  }),
);

/* ---------- 智能推荐科室 ---------- */

// 科室关键词映射（中文医疗场景）
const DEPT_KEYWORDS = {
  '内科': ['发烧','发热','咳嗽','感冒','头痛','头晕','乏力','胸闷','心悸','高血压','心脏','冠心病',
           '糖尿病','高血糖','消化','胃痛','胃炎','腹痛','腹泻','便秘','肝','肾','慢性病',
           '呼吸','气短','贫血','肺炎','支气管','哮喘','恶心','呕吐','水肿','关节炎'],
  '外科': ['骨折','骨头','受伤','创伤','手术','肿块','肿瘤','阑尾','疝气','痔疮','切除','腰椎',
           '颈椎','脊柱','扭伤','脱臼','刀伤','外伤','皮下','结石','胆囊','胆结石','腹腔'],
  '儿科': ['小儿','儿童','婴儿','宝宝','孩子','小孩','发育','身高','体重','新生儿','幼儿',
           '退烧','儿童发烧','小孩发烧','手足口','疫苗','接种','矮小'],
  '妇科': ['月经','痛经','白带','妇科','子宫','卵巢','宫颈','孕','怀孕','妊娠','产后',
           '更年期','乳房','乳腺','HPV','宫颈炎','阴道','妇女'],
  '骨科': ['骨折','关节','膝盖','膝关节','腰痛','颈椎','脊椎','骨质疏松','关节痛','肩膀',
           '手腕','脚踝','跌倒','腰背痛','椎间盘'],
  '皮肤科': ['皮疹','皮肤','湿疹','荨麻疹','过敏','痤疮','痘','脱发','白斑','癣','银屑病',
             '瘙痒','皮炎','脂溢性','痣','斑'],
  '眼科': ['眼睛','视力','近视','散光','白内障','青光眼','眼干','眼痛','结膜炎','眼红',
           '流泪','视野','斜视','弱视'],
  '耳鼻喉科': ['耳','耳鸣','耳聋','鼻','鼻塞','鼻炎','鼻出血','流鼻血','咽喉','嗓子','扁桃体',
               '声音嘶哑','喉咙','咽炎','中耳炎'],
  '口腔科': ['牙','牙痛','龋齿','蛀牙','牙龈','牙齿','口腔','拔牙','补牙','智齿','口臭'],
  '精神科': ['失眠','焦虑','抑郁','情绪','心理','精神','恐慌','躁狂','强迫','幻觉','记忆力'],
  '神经科': ['头痛','偏头痛','头晕','眩晕','中风','卒中','癫痫','神经','手麻','脚麻','帕金森'],
  '急诊科': ['急诊','紧急','突然','晕倒','昏迷','心脏停','呼吸困难','大出血','严重','危急'],
};

app.post(
  '/api/recommend-dept',
  asyncHandler(async (req, res) => {
    const { description } = req.body || {};
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: '请提供病情描述' });
    }
    const text = String(description).trim();

    // 计算每个科室的匹配得分
    const scores = {};
    for (const [dept, keywords] of Object.entries(DEPT_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score += 1;
      }
      if (score > 0) scores[dept] = score;
    }

    // 排序，取前3名
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dept, score]) => ({ dept_name: dept, score }));

    // 从数据库中批量查询匹配科室的详细信息（避免 N+1 查询）
    const deptNames = sorted.map(item => item.dept_name);
    let deptRows = [];
    if (deptNames.length > 0) {
      const placeholders = deptNames.map(() => '?').join(',');
      const [rows] = await pool.query(
        `SELECT dept_id, dept_name, dept_intro FROM department WHERE dept_name IN (${placeholders})`,
        deptNames
      );
      deptRows = rows;
    }
    const deptMap = Object.fromEntries(deptRows.map(r => [r.dept_name, r]));

    const results = sorted.map(item => {
      const dept = deptMap[item.dept_name];
      if (dept) {
        return { ...dept, score: item.score };
      }
      return { dept_id: null, dept_name: item.dept_name, dept_intro: null, score: item.score };
    });

    if (results.length === 0) {
      return res.json({ results: [], message: '根据描述无法确定科室，请咨询导诊台' });
    }

    res.json({ results, message: null });
  }),
);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
